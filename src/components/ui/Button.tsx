import { ActivityIndicator, Pressable, Text } from "react-native";
import { useThemeColors } from "@/constants/colors";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor:
          variant === "primary"
            ? colors.pink
            : variant === "secondary"
              ? colors.card
              : "transparent",
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: variant === "secondary" ? colors.lightGray : undefined,
        opacity: pressed && !isDisabled ? 0.8 : isDisabled ? 0.5 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : colors.text}
          size="small"
        />
      ) : (
        <Text
          style={{
            fontSize: 16,
            fontFamily:
              variant === "primary"
                ? "Poppins_700Bold"
                : variant === "secondary"
                  ? "Poppins_600SemiBold"
                  : "Poppins_500Medium",
            color:
              variant === "primary"
                ? "#FFFFFF"
                : variant === "ghost"
                  ? colors.pink
                  : colors.text,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
