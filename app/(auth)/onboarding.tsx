import { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { Ticket, Music, Award } from "lucide-react-native";
import { useThemeColors, type ThemeColors } from "@/constants/colors";
import { useUIStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

const { width } = Dimensions.get("window");

function getSlides(colors: ThemeColors) {
  return [
    {
      icon: Ticket,
      color: colors.pink,
      title: "Your Live Music Passport",
      description:
        "Every show you attend becomes a stamp in your passport. The more you show up, the more you get in.",
    },
    {
      icon: Music,
      color: colors.teal,
      title: "Collect Artists at Shows",
      description:
        "Scan at venues or discover online. Build your collection and climb tiers from Fan to Inner Circle.",
    },
    {
      icon: Award,
      color: colors.purple,
      title: "Earn Badges & Share",
      description:
        "Unlock badges for your music journey. Share your passport and show the world your taste.",
    },
  ];
}

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const slides = getSlides(colors);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const setOnboardingComplete = useUIStore((s) => s.setOnboardingComplete);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * width, animated: true });
    } else {
      finish();
    }
  };

  const finish = () => {
    setOnboardingComplete();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-decibel">
      {/* Skip button */}
      <View className="absolute top-16 right-6 z-10">
        <Button title="Skip" variant="ghost" onPress={finish} />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
      >
        {slides.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <View
              key={index}
              style={{ width }}
              className="flex-1 items-center justify-center px-10"
            >
              <View
                className="w-32 h-32 rounded-full items-center justify-center mb-10"
                style={{ backgroundColor: `${slide.color}20` }}
              >
                <Icon size={64} color={slide.color} />
              </View>
              <Text className="font-poppins-bold text-white text-2xl text-center mb-4">
                {slide.title}
              </Text>
              <Text className="font-poppins text-gray text-base text-center leading-6">
                {slide.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom: dots + button */}
      <View className="pb-14 px-6">
        {/* Dot indicators */}
        <View className="flex-row items-center justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === currentPage ? "w-8" : "w-2"
              }`}
              style={{
                backgroundColor:
                  index === currentPage ? colors.pink : colors.lightGray,
              }}
            />
          ))}
        </View>

        <Button
          title={currentPage === slides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}
