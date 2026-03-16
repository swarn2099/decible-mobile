import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useThemeColors } from "@/constants/colors";
import { useFollow, type UserSearchResult } from "@/hooks/useUserSearch";
import { useState } from "react";

type Props = {
  user: UserSearchResult;
  onPress?: (user: UserSearchResult) => void;
};

export function UserResultCard({ user, onPress }: Props) {
  const colors = useThemeColors();
  const { followMutation, unfollowMutation } = useFollow();
  const [isFollowing, setIsFollowing] = useState(user.is_following);

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      unfollowMutation.mutate(user.id, {
        onError: () => setIsFollowing(true),
      });
    } else {
      setIsFollowing(true);
      followMutation.mutate(user.id, {
        onError: () => setIsFollowing(false),
      });
    }
  };

  const initials = user.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable
      onPress={() => onPress?.(user)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.card,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={{ width: 44, height: 44 }}
            contentFit="cover"
          />
        ) : (
          <Text
            style={{ color: colors.textSecondary, fontSize: 16 }}
            className="font-poppins-semibold"
          >
            {initials}
          </Text>
        )}
      </View>

      {/* Name + stamp count */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.text, fontSize: 15 }}
          className="font-poppins-medium"
          numberOfLines={1}
        >
          {user.display_name}
        </Text>
        <Text
          style={{ color: colors.textSecondary, fontSize: 12 }}
          className="font-poppins"
        >
          {user.find_count} find{user.find_count !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Follow button */}
      <Pressable
        onPress={handleToggleFollow}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: isFollowing ? "transparent" : colors.pink,
          borderWidth: isFollowing ? 1 : 0,
          borderColor: colors.cardBorder,
        }}
      >
        <Text
          style={{
            color: isFollowing ? colors.textSecondary : "#fff",
            fontSize: 13,
          }}
          className="font-poppins-medium"
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </Pressable>
    </Pressable>
  );
}
