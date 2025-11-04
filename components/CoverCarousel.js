import React, { useMemo, useEffect, useRef } from "react";
import { View, Image, Animated, Easing, StyleSheet } from "react-native";
import coverAssetsModule, { coverList as coverListExport } from "../lib/cover-assets";
import { libraryBooks } from "../lib/epub-manifest";

const coverAssetNamespace =
  (coverAssetsModule && typeof coverAssetsModule === "object" ? coverAssetsModule : {}) ?? {};
const coverAssets =
  coverAssetNamespace.coverAssets ??
  coverAssetNamespace.default ??
  coverAssetsModule ??
  {};
const coverList =
  Array.isArray(coverListExport)
    ? coverListExport
    : Array.isArray(coverAssetNamespace.coverList)
      ? coverAssetNamespace.coverList
      : coverAssets && typeof coverAssets === "object"
        ? Object.values(coverAssets)
        : [];

const CARD_WIDTH = 132;
const CARD_HEIGHT = 198;
const CARD_SPACING = 24;
const PLACEHOLDER_COLORS = ["#d6d3d1", "#e7e5e4", "#cbd5f5", "#c7d2fe"];
const STRIDE = CARD_WIDTH + CARD_SPACING;

function useRowAnimation({ distance, speed, direction }) {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    if (!distance || !speed) return undefined;
    const duration = Math.max(distance / speed, 8) * 1000;

    animationRef.current?.stop();
    progress.stopAnimation();
    progress.setValue(0);

    let mounted = true;
    const run = () => {
      const animation = Animated.timing(progress, {
        toValue: distance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      });

      animationRef.current = animation;
      animation.start(({ finished }) => {
        if (!mounted) return;
        if (finished) {
          progress.setValue(0);
          run();
        }
      });
    };

    run();

    return () => {
      mounted = false;
      animationRef.current?.stop();
    };
  }, [distance, speed, progress]);

  if (!distance || !speed) {
    return 0;
  }

  const outputRange = direction === "left" ? [0, -distance] : [-distance, 0];
  return progress.interpolate({
    inputRange: [0, distance],
    outputRange,
  });
}

function buildRows({
  totalRows,
  cardsPerRow,
  covers,
}) {
  const totalSlots = totalRows * cardsPerRow;
  if (totalSlots === 0) return [];

  let sequence;
  if (covers.length === 0) {
    sequence = new Array(totalSlots).fill(null);
  } else if (covers.length >= totalSlots) {
    sequence = covers.slice(0, totalSlots);
  } else {
    sequence = Array.from({ length: totalSlots }, (_, index) => covers[index % covers.length]);
  }

  const rows = [];
  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const start = rowIndex * cardsPerRow;
    rows.push(sequence.slice(start, start + cardsPerRow));
  }

  return rows;
}

function PlaceholderCard({ index }) {
  const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
  return <View style={[styles.card, styles.placeholder, { backgroundColor: color }]} />;
}

function CoverCard({ cover, index }) {
  if (!cover) {
    return <PlaceholderCard index={index} />;
  }
  return (
    <Image
      source={cover}
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      style={styles.card}
    />
  );
}

const CoverRow = React.memo(function CoverRow({ cards, direction, speed }) {
  const baseWidth = cards.length * STRIDE;

  if (!cards.length || baseWidth <= 0 || !speed) {
    return <View style={[styles.rowClip, styles.rowEmpty]} />;
  }

  const translateX = useRowAnimation({ distance: baseWidth, speed, direction });

  const segments = useMemo(
    () =>
      [0, 1].map((segment) => (
        <View key={`segment-${segment}`} style={[styles.rowSegment, { width: baseWidth }]}>
          {cards.map((cover, index) => {
            const coverKey =
              typeof cover === "number"
                ? `asset-${cover}`
                : typeof cover === "object" && cover?.uri
                  ? `uri-${cover.uri}`
                  : "placeholder";
            const key = `${coverKey}-${segment}-${index}`;
            return (
              <View key={key} style={styles.cardWrapper}>
                <CoverCard cover={cover} index={index} />
              </View>
            );
          })}
        </View>
      )),
    [cards, baseWidth]
  );

  return (
    <View style={styles.rowClip}>
      <Animated.View
        style={[
          styles.rowTrack,
          {
            width: baseWidth * 2,
            transform: [{ translateX }],
          },
        ]}
        pointerEvents="none"
      >
        {segments}
      </Animated.View>
    </View>
  );
});

function CoverCarouselComponent({
  rows = 4,
  cardsPerRow = 10,
  minSpeed = 42,
  maxSpeed = 68,
}) {
  const covers = useMemo(() => {
    const generatedAssets = coverList
      .map((entry) => {
        if (!entry) return null;
        if (entry.source) return entry.source;
        if (entry.uri) return { uri: entry.uri };
        return null;
      })
      .filter(Boolean);
    if (generatedAssets.length > 0) {
      return generatedAssets;
    }
    const manifestFallback = libraryBooks
      .filter((book) => book?.cover?.uri)
      .map((book) => ({ uri: book.cover.uri }));
    return manifestFallback;
  }, []);

  const rowsData = useMemo(() => buildRows({ totalRows: rows, cardsPerRow, covers }), [rows, cardsPerRow, covers]);

  const rowConfigs = useMemo(
    () =>
      rowsData.map((_, index) => ({
        direction: index % 2 === 0 ? "left" : "right",
        speed: minSpeed + Math.random() * Math.max(maxSpeed - minSpeed, 1),
      })),
    [rowsData, minSpeed, maxSpeed]
  );

  return (
    <View style={styles.carousel} pointerEvents="none">
      {rowsData.map((cards, index) => (
        <CoverRow
          key={`row-${index}`}
          cards={cards}
          direction={rowConfigs[index].direction}
          speed={rowConfigs[index].speed}
        />
      ))}
    </View>
  );
}

const CoverCarousel = React.memo(CoverCarouselComponent);

export default CoverCarousel;

const styles = StyleSheet.create({
  carousel: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  rowClip: {
    overflow: "hidden",
    marginBottom: CARD_SPACING,
  },
  rowTrack: {
    flexDirection: "row",
  },
  rowSegment: {
    flexDirection: "row",
  },
  rowEmpty: {
    height: CARD_HEIGHT,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  placeholder: {
    opacity: 0.55,
  },
});
