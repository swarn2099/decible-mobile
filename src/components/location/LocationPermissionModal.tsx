import { useEffect } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { MapPin } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

type LocationPermissionModalProps = {
  visible: boolean;
  explanationText: string;
  onEnable: () => void;
  onClose: () => void;
};

export function LocationPermissionModal({
  visible,
  explanationText,
  onEnable,
  onClose,
}: LocationPermissionModalProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          },
        ]}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 32,
            alignItems: "center",
            width: "100%",
            maxWidth: 340,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: `${colors.pink}20`,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <MapPin size={32} color={colors.pink} />
          </View>

          {/* Title */}
          <Text
            style={{
              color: colors.white,
              fontFamily: "Poppins_700Bold",
              fontSize: 20,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Know When You're at a Show
          </Text>

          {/* Explanation */}
          <Text
            style={{
              color: colors.gray,
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            {explanationText}
          </Text>

          {/* Enable button */}
          <Pressable
            onPress={onEnable}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#E63D5A" : colors.pink,
              borderRadius: 14,
              paddingVertical: 14,
              width: "100%",
              alignItems: "center",
              marginBottom: 12,
            })}
          >
            <Text
              style={{
                color: colors.white,
                fontFamily: "Poppins_700Bold",
                fontSize: 16,
              }}
            >
              Enable Location
            </Text>
          </Pressable>

          {/* Not Now button */}
          <Pressable onPress={onClose} style={{ paddingVertical: 10 }}>
            <Text
              style={{
                color: colors.gray,
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
              }}
            >
              Not Now
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
