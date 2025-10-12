
// screens/HomeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/global-styles";
import { libraryBooks, recommendations, allBooks, allGroups } from "../data/data";

export default function HomeScreen() {
  const [selectedBook, setSelectedBook] = useState(null);

  const handleBookPress = (book) => setSelectedBook(book);

  const handleAddToLibrary = (book) => {
    Alert.alert("Added!", `"${book.title}" has been added to your library.`);
    setSelectedBook(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Goodreads2</Text>
          <Pressable style={styles.browseButton}>
            <Text style={styles.browseText}>Browse</Text>
          </Pressable>
        </View>

        {/* Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {libraryBooks.map((book, index) => (
              <Pressable key={index} onPress={() => handleBookPress(book)}>
                <View style={styles.bookCard}>
                  <Image source={book.cover} style={styles.bookCover} />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <View style={styles.recommendationsGrid}>
            {recommendations.map((item, index) => (
              <Pressable key={index} onPress={() => handleBookPress(item)}>
                <View style={styles.bookCard}>
                  <Image source={item.cover} style={styles.bookCover} />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Book Modal */}
      <Modal visible={!!selectedBook} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBook && (
              <>
                <Image source={selectedBook.cover} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                <Text style={styles.modalAuthor}>
                  {selectedBook.author || "Unknown Author"}
                </Text>
                <Text style={styles.modalBlurb}>
                  {selectedBook.blurb || "This is a sample blurb."}
                </Text>

                {libraryBooks.some((b) => b.title === selectedBook.title) ? (
                  <Pressable style={styles.button}>
                    <Text style={styles.buttonLabel}>Continue Reading</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.button}
                    onPress={() => handleAddToLibrary(selectedBook)}
                  >
                    <Text style={styles.buttonLabel}>Add to Library</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.button, { backgroundColor: "#888" }]}
                  onPress={() => setSelectedBook(null)}
                >
                  <Text style={styles.buttonLabel}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}



// import React from "react";
// import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
// import { useNavigation } from "@react-navigation/native";

// const sampleLibrary = [
//   { id: "1", title: "The Alchemist", cover: "https://m.media-amazon.com/images/I/71+2-t7M35L._UF1000,1000_QL80_.jpg" },
//   { id: "2", title: "1984", cover: "https://m.media-amazon.com/images/I/71wANojhEKL._UF1000,1000_QL80_.jpg" },
// ];

// const sampleRecommendations = [
//   { id: "r1", title: "Siddhartha", author: "Hesse" },
//   { id: "r2", title: "Brave New World", author: "Huxley" },
//   { id: "r3", title: "The Prophet", author: "Gibran" },
// ];


// export default function HomeScreen() {
//   const navigation = useNavigation();

//   return (
//     <FlatList
//       data={sampleRecommendations}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <View className="p-4 border-b border-gray-200">
//           <Text className="text-lg font-semibold">{item.title}</Text>
//           <Text className="text-gray-600">{item.author}</Text>
//         </View>
//       )}
//       ListHeaderComponent={
//         <View className="p-4">
//           <Text className="text-xl font-bold mb-2">Your Library</Text>
//           <FlatList
//             data={sampleLibrary}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 className="mr-3"
//                 onPress={() => navigation.navigate("Library")}
//               >
//                 <Image
//                   source={{ uri: item.cover }}
//                   className="w-24 h-36 rounded-xl"
//                 />
//               </TouchableOpacity>
//             )}
//           />
//         </View>
//       }
//     />
//   );
// }