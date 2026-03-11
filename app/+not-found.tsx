import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";

export default function NotFoundScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          marginBottom: 8,
        }}
      >
        Page not found
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginBottom: 24,
        }}
      >
        This screen doesn't exist.
      </Text>
      <Button title="Go Home" onPress={() => router.replace("/")} />
    </View>
  );
}
