import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { House, Plus, Ticket } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TAB_CONFIG: {
  name: string;
  title: string;
  Icon: LucideIcon;
  isCenter?: boolean;
}[] = [
  { name: "index", title: "Home", Icon: House },
  { name: "add", title: "Add", Icon: Plus, isCenter: true },
  { name: "passport", title: "Passport", Icon: Ticket },
];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const activeColor = colors.pink;
  const inactiveColor = colors.isDark
    ? "rgba(255,255,255,0.55)"
    : "rgba(0,0,0,0.45)";

  return (
    <View
      style={[styles.tabBarContainer, { bottom: insets.bottom + 8 }]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={40}
        tint={colors.isDark ? "dark" : "light"}
        style={[
          styles.pill,
          {
            backgroundColor: colors.isDark
              ? "rgba(11, 11, 15, 0.88)"
              : "rgba(245, 245, 247, 0.92)",
            borderColor: colors.isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
            shadowColor: colors.isDark
              ? "rgba(0,0,0,0.5)"
              : "rgba(0,0,0,0.15)",
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG.find((t) => t.name === route.name);
          if (!config) return null;

          const isFocused = state.index === index;
          const color = config.isCenter
            ? "#FFFFFF"
            : isFocused
            ? activeColor
            : inactiveColor;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (config.isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.centerTab}
              >
                <View
                  style={[
                    styles.centerButton,
                    {
                      backgroundColor: colors.pink,
                      shadowColor: colors.pink,
                    },
                  ]}
                >
                  <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <config.Icon
                size={22}
                color={color}
                strokeWidth={isFocused ? 2.5 : 2}
              />
              <Text style={[styles.label, { color }]}>{config.title}</Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="passport" options={{ title: "Passport" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    borderRadius: 28,
    height: 56,
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  centerTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
});
