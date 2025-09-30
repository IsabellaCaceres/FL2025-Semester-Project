import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const sampleLibrary = [
  { id: "1", title: "The Alchemist", cover: "https://m.media-amazon.com/images/I/71+2-t7M35L._UF1000,1000_QL80_.jpg" },
  { id: "2", title: "1984", cover: "https://m.media-amazon.com/images/I/71wANojhEKL._UF1000,1000_QL80_.jpg" },
];

const sampleRecommendations = [
  { id: "r1", title: "Siddhartha", author: "Hesse" },
  { id: "r2", title: "Brave New World", author: "Huxley" },
  { id: "r3", title: "The Prophet", author: "Gibran" },
];


export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <FlatList
      data={sampleRecommendations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold">{item.title}</Text>
          <Text className="text-gray-600">{item.author}</Text>
        </View>
      )}
      ListHeaderComponent={
        <View className="p-4">
          <Text className="text-xl font-bold mb-2">Your Library</Text>
          <FlatList
            data={sampleLibrary}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="mr-3"
                onPress={() => navigation.navigate("Library")}
              >
                <Image
                  source={{ uri: item.cover }}
                  className="w-24 h-36 rounded-xl"
                />
              </TouchableOpacity>
            )}
          />
        </View>
      }
    />
  );
}