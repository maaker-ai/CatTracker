#!/usr/bin/env node
/**
 * Expo 项目规范验证器
 *
 * 由 Claude Code Hook 在文件编辑后自动运行。
 * 检查已知踩坑项，输出到 stderr 让 agent 看到并修复。
 *
 * 退出码: 0=通过, 1=有违规
 */

const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
if (files.length === 0) process.exit(0);

const violations = [];

function check(file, content) {
  const lines = content.split('\n');
  const ext = path.extname(file);

  // 只检查 .tsx/.ts 文件
  if (!['.tsx', '.ts'].includes(ext)) return;

  // --- Rule 1: DateTimePicker 必须传 locale ---
  if (content.includes('DateTimePicker') && content.includes('<DateTimePicker')) {
    const dtpMatches = content.matchAll(/<DateTimePicker[\s\S]*?\/>/g);
    for (const match of dtpMatches) {
      if (!match[0].includes('locale')) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        violations.push({
          file,
          line: lineNum,
          rule: 'DateTimePicker 缺少 locale 属性',
          fix: '添加 locale={i18n.language}，从 useTranslation() 解构 i18n',
        });
      }
    }
  }

  // --- Rule 2: Modal 内有 TextInput 但没有 KeyboardAvoidingView ---
  if (content.includes('<Modal') && content.includes('<TextInput')) {
    // 找到每个 Modal 块，检查是否有 KeyboardAvoidingView
    const modalRegex = /<Modal[\s\S]*?<\/Modal>/g;
    let modalMatch;
    while ((modalMatch = modalRegex.exec(content)) !== null) {
      const modalContent = modalMatch[0];
      if (modalContent.includes('<TextInput') && !modalContent.includes('KeyboardAvoidingView')) {
        const lineNum = content.substring(0, modalMatch.index).split('\n').length;
        violations.push({
          file,
          line: lineNum,
          rule: 'Modal 内有 TextInput 但缺少 KeyboardAvoidingView',
          fix: '用 KeyboardAvoidingView (behavior="padding" on iOS) + ScrollView 包裹表单',
        });
      }
    }
  }

  // --- Rule 3: 硬编码用户可见字符串（未用 i18n） ---
  // 检查 JSX 中的纯文本（排除注释、import、变量名等）
  if (file.endsWith('.tsx') && content.includes('useTranslation')) {
    const hardcodedStrings = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 跳过 import、注释、style 属性
      if (line.startsWith('import ') || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
      if (line.includes('fontFamily:') || line.includes('backgroundColor:') || line.includes('color:')) continue;

      // 检查 JSX 中的 >文字< 模式（中文或长英文）
      const jsxTextMatch = line.match(/>([^<>{}\n]{4,})</);
      if (jsxTextMatch) {
        const text = jsxTextMatch[1].trim();
        // 排除纯数字、变量插值、短标点
        if (text && !/^[\d.%\s:,/\-+*]+$/.test(text) && !text.startsWith('{') && !/^[A-Z_]+$/.test(text)) {
          // 检查是否包含中文或有意义的英文词
          if (/[\u4e00-\u9fff]/.test(text) || (text.length > 10 && /[a-zA-Z]{3,}/.test(text))) {
            hardcodedStrings.push({ line: i + 1, text: text.substring(0, 40) });
          }
        }
      }
    }
    // 只报前 3 个，避免刷屏
    for (const hs of hardcodedStrings.slice(0, 3)) {
      violations.push({
        file,
        line: hs.line,
        rule: '疑似硬编码字符串未使用 t()',
        fix: `"${hs.text}" → 用 t('key') 替换`,
      });
    }
  }

  // --- Rule 4: TextInput 用于日期输入 ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<TextInput') || line.includes('<EditField')) {
      // 只检查同一行或紧邻的 label 属性中是否有日期关键词
      const nearContext = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 2)).join(' ');
      // label 属性直接包含日期关键词才算
      const labelMatch = nearContext.match(/label=\{?["']?([^"'}]+)/);
      if (labelMatch) {
        const label = labelMatch[1].toLowerCase();
        if (/\b(date|birthday|生日|日期|born|出生)\b/.test(label)) {
          violations.push({
            file,
            line: i + 1,
            rule: '日期字段使用了 TextInput',
            fix: '改用 @react-native-community/datetimepicker 的 DateTimePicker',
          });
        }
      }
    }
  }

  // --- Rule 5: placeholder 硬编码具体数值 ---
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/placeholder=["'](\d+\.?\d*)["']/);
    if (match) {
      const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join(' ').toLowerCase();
      // 只在体重/金额/数量等场景报
      if (/weight|体重|price|amount|kg|lb/.test(context)) {
        violations.push({
          file,
          line: i + 1,
          rule: `placeholder 硬编码了具体数值 "${match[1]}"`,
          fix: '用数据库最近一条记录的值，或留空',
        });
      }
    }
  }

  // --- Rule 6: TextInput 缺少 returnKeyType ---
  const textInputRegex = /<TextInput[\s\S]*?\/>/g;
  let tiMatch;
  while ((tiMatch = textInputRegex.exec(content)) !== null) {
    if (!tiMatch[0].includes('returnKeyType')) {
      const lineNum = content.substring(0, tiMatch.index).split('\n').length;
      violations.push({
        file,
        line: lineNum,
        rule: 'TextInput 缺少 returnKeyType',
        fix: '添加 returnKeyType="done" 或 "next"',
      });
    }
  }
}

// --- Rule 7: 有通知/提醒 UI 但没调用通知功能 ---
let reminderUIFiles = [];  // 有 Switch + reminder 关键词的文件
let notificationImplFiles = [];  // 引用了通知调度的文件

// 执行检查
for (const file of files) {
  const absPath = path.isAbsolute(file) ? file : path.resolve(file);
  if (!fs.existsSync(absPath)) continue;

  try {
    const content = fs.readFileSync(absPath, 'utf-8');
    check(absPath, content);

    // Rule 7: 收集通知相关信息
    const lower = content.toLowerCase();
    const hasSwitch = /<Switch[\s\S]*?\/>/g.test(content);
    const hasReminderKeyword = /reminder|notification|提醒|通知/.test(lower);
    const hasNotifCode = /schedulenotif|schedulereminder|expo-notifications|cancelnotif|cancelreminder/i.test(content);

    if (hasSwitch && hasReminderKeyword) {
      reminderUIFiles.push(absPath);
      if (hasNotifCode) {
        notificationImplFiles.push(absPath);
      }
    }
  } catch (e) {
    // 忽略读取错误
  }
}

// Rule 7: 有提醒开关 UI 的文件必须有通知调度代码
for (const uiFile of reminderUIFiles) {
  if (!notificationImplFiles.includes(uiFile)) {
    violations.push({
      file: uiFile,
      line: 0,
      rule: '有提醒/通知开关 UI 但该文件未调用通知调度函数',
      fix: '开关必须绑定真实通知逻辑（scheduleReminder/cancelReminder），假开关 = 欺骗用户。需要 expo-notifications + 权限请求 + 延迟调度',
    });
  }
}

// 输出结果
if (violations.length > 0) {
  console.error('\n⚠️  Expo 规范检查发现 ' + violations.length + ' 个问题:\n');
  for (const v of violations) {
    const relPath = path.relative(process.cwd(), v.file);
    console.error(`  ${relPath}:${v.line}`);
    console.error(`    ❌ ${v.rule}`);
    console.error(`    💡 ${v.fix}\n`);
  }
  process.exit(1);
}

process.exit(0);
