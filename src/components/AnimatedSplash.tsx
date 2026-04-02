import { useEffect } from 'react';
import { View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Logo fade in + scale up
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

    // Text fade in after logo
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // Fade out the whole splash after display
    containerOpacity.value = withDelay(
      1200,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }, () => {
        // Always call onFinish regardless of finished flag —
        // in Expo Go, reanimated may report finished=false on interruption
        runOnJS(onFinish)();
      })
    );

    // Fallback: guarantee splash dismisses even if animation never fires
    const fallback = setTimeout(onFinish, 2500);
    return () => clearTimeout(fallback);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        },
        containerStyle,
      ]}
    >
      <Animated.View style={logoStyle}>
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 100, height: 100, borderRadius: 24 }}
        />
      </Animated.View>
      <Animated.Text
        style={[
          {
            fontFamily: 'Inter-Bold',
            fontSize: 24,
            color: Colors.textPrimary,
            marginTop: 16,
          },
          textStyle,
        ]}
      >
        CatTracker
      </Animated.Text>
    </Animated.View>
  );
}
