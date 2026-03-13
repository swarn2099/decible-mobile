import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { GlassGrid } from "./GlassGrid";
import type { CollectionStamp } from "@/types/passport";
interface PassportPagerProps {
  stamps: CollectionStamp[];
  finds: CollectionStamp[];
  discoveries: CollectionStamp[];
  onViewMore: (type: "stamp" | "find" | "discovery") => void;
  activeTabIndex: SharedValue<number>;
  onTabChange: (index: number) => void;
}

const TAB_LABELS = ["Stamps", "Finds", "Discoveries"] as const;

export function PassportPager({
  stamps,
  finds,
  discoveries,
  onViewMore,
  activeTabIndex,
  onTabChange,
}: PassportPagerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);

  const TAB_WIDTH = screenWidth / 3;
  const underlineX = useSharedValue(0);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
  }));

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;
    setActiveTab(position);
    onTabChange(position);
    activeTabIndex.value = position;
    underlineX.value = withTiming(position * TAB_WIDTH, { duration: 200 });
  };

  const handlePageScroll = (e: {
    nativeEvent: { position: number; offset: number };
  }) => {
    const continuous = e.nativeEvent.position + e.nativeEvent.offset;
    underlineX.value = continuous * TAB_WIDTH;
    activeTabIndex.value = continuous;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab bar — underline style */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        {TAB_LABELS.map((label, i) => (
          <Pressable
            key={i}
            onPress={() => handleTabPress(i)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily:
                  activeTab === i
                    ? "Poppins_600SemiBold"
                    : "Poppins_500Medium",
                color: activeTab === i ? "#FFFFFF" : "#8E8E93",
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}

        {/* Animated underline indicator */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              height: 2,
              width: TAB_WIDTH * 0.5,
              marginLeft: TAB_WIDTH * 0.25,
              backgroundColor: "#FFFFFF",
              borderRadius: 1,
            },
            underlineStyle,
          ]}
        />
      </View>

      {/* PagerView */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {/* Page 0 — Stamps */}
        <ScrollView
          key="0"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <GlassGrid
            items={stamps}
            type="stamp"
            onViewMore={() => onViewMore("stamp")}
          />

        </ScrollView>

        {/* Page 1 — Finds */}
        <ScrollView
          key="1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <GlassGrid
            items={finds}
            type="find"
            onViewMore={() => onViewMore("find")}
          />

        </ScrollView>

        {/* Page 2 — Discoveries */}
        <ScrollView
          key="2"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <GlassGrid
            items={discoveries}
            type="discovery"
            onViewMore={() => onViewMore("discovery")}
          />

        </ScrollView>
      </PagerView>
    </View>
  );
}
