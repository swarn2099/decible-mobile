import { useRef } from "react";
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "react-native";
import { useThemeColors } from "@/constants/colors";

const STAMP_HEIGHT = 152; // stamp height (130) + margins (12 top + 10 bottom)
const STAMPS_PER_PAGE = 5;

type Props = {
  scrollY: SharedValue<number>;
  totalStamps: number;
};

export function PageIndicator({ scrollY, totalStamps }: Props) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalStamps / STAMPS_PER_PAGE));
  const currentPage = useSharedValue(1);

  const scheduleHide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
    }, 1500);
  };

  useAnimatedReaction(
    () => scrollY.value,
    (value) => {
      const page = Math.floor(value / (STAMP_HEIGHT * STAMPS_PER_PAGE)) + 1;
      currentPage.value = Math.min(page, totalPages);
      opacity.value = withTiming(1, { duration: 150 });
      runOnJS(scheduleHide)();
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Animated text requires derived value approach — use a derived label
  // We display based on currentPage shared value via animatedProps or just
  // render a fixed label updated via JS. For simplicity, use a Text inside
  // Animated.View driven by the fade only; page number updates via JS state.
  // Since useAnimatedReaction runs on UI thread and we use runOnJS for hide,
  // the page calc is on UI thread. We'll pass totalPages as prop and compute
  // display inline using a derived JS value.

  const displayPage = Math.min(
    Math.max(1, Math.floor((scrollY.value ?? 0) / (STAMP_HEIGHT * STAMPS_PER_PAGE)) + 1),
    totalPages
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          bottom: 110,
          right: 20,
          backgroundColor: `${colors.card}E6`,
          borderRadius: 12,
          paddingVertical: 6,
          paddingHorizontal: 12,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Poppins_500Medium",
          color: colors.textSecondary,
        }}
      >
        Page {displayPage} of {totalPages}
      </Text>
    </Animated.View>
  );
}
