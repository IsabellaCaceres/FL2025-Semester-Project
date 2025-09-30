import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import books from "../data/books.json"; // now points to /data/books.json

const GenreBrowse = () => {
  const navigation = useNavigation();

  const allGenres = Array.from(new Set(books.flatMap((b) => b.genres)));

  return (
    <ScrollView style={styles.container}>
      {allGenres.map((genre) => (
        <View style={styles.genreSection} key={genre}>
          <Text style={styles.genreTitle}>{genre}</Text>
          <View style={styles.bookRow}>
            {books.map((book, index) =>
              book.genres.includes(genre) ? (
                <TouchableOpacity
                  key={index}
                  style={styles.book}
                  onPress={() => navigation.navigate("BookDetail", { id: index })}
                >
                  <Image
                    source={require("../assets/cover.png")}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>By {book.author}</Text>
                </TouchableOpacity>
              ) : null
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  genreSection: { marginBottom: 24 },
  genreTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  bookRow: { flexDirection: "row", flexWrap: "wrap" },
  book: { width: "45%", margin: "2.5%", alignItems: "center" },
  cover: { width: 120, height: 180, marginBottom: 8 },
  bookTitle: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  bookAuthor: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 2,
  },
});

export default GenreBrowse;


// // pages/GenreBrowse.jsx
// import React from "react";
// import { View, Text, StyleSheet } from "react-native";

// export default function GenreBrowse() {
//     console.log("genre");
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>hello! this is browse</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center" },
//   text: { fontSize: 20 }
// });

// pages/GenreBrowse.jsx




// import React from "react";
// import {
//   View,
//   Text,
//   Image,
//   ScrollView,
//   StyleSheet,
// } from "react-native";
// import books from "../data/books.json";

// export default function GenreBrowse() {
//   // collect all unique genres
//   const allGenres = Array.from(new Set(books.flatMap((book) => book.genres)));

//   return (
//     <ScrollView style={styles.container}>
//       {allGenres.map((genre) => (
//         <View style={styles.genreSection} key={genre}>
//           <Text style={styles.genreTitle}>{genre}</Text>

//           <View style={styles.bookRow}>
//             {books
//               .map((book, index) => ({ ...book, _id: index }))
//               .filter((book) => book.genres.includes(genre))
//               .map((book) => (
//                 <View style={styles.book} key={book._id}>
//                   {/* For static assets in JSON, require() must be used */}
//                   <Image
//                     source={require("../assets/cover.png")}
//                     style={styles.cover}
//                   />
//                   <Text style={styles.bookTitle}>{book.title}</Text>
//                   <Text style={styles.bookAuthor}>By {book.author}</Text>
//                 </View>
//               ))}
//           </View>
//         </View>
//       ))}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 12,
//   },
//   genreSection: {
//     marginBottom: 24,
//   },
//   genreTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 12,
//     textTransform: "capitalize",
//   },
//   bookRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//   },
//   book: {
//     width: "45%",
//     margin: "2.5%",
//     alignItems: "center",
//   },
//   cover: {
//     width: 120,
//     height: 180,
//     resizeMode: "cover",
//     marginBottom: 8,
//   },
//   bookTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   bookAuthor: {
//     fontSize: 12,
//     fontStyle: "italic",
//     textAlign: "center",
//     marginTop: 2,
//   },
// });
