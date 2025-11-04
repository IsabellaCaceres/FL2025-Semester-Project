import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Modal, View, Text, Pressable, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { fromByteArray } from "base64-js";
import { downloadBook } from "../lib/api";
import { useLibrary } from "../lib/library-context";
import { theme } from "../styling/theme";

let WebViewComponent = null;
if (Platform.OS !== "web") {
  WebViewComponent = require("react-native-webview").WebView;
}

const EPUB_CDN_URL = "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js";

let epubLoaderPromise = null;
let jsZipLoaderPromise = null;

const ensureJsZipGlobal = () => {
  if (Platform.OS !== "web") {
    return Promise.resolve(null);
  }

  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.JSZip) {
    return Promise.resolve(window.JSZip);
  }

  if (jsZipLoaderPromise) {
    return jsZipLoaderPromise;
  }

  jsZipLoaderPromise = import("jszip")
    .then((module) => {
      const candidate = module?.default ?? module;
      const resolved = candidate?.default ?? candidate;
      if (!resolved) {
        throw new Error("JSZip module did not export a value.");
      }
      window.JSZip = resolved;
      return resolved;
    })
    .catch((error) => {
      jsZipLoaderPromise = null;
      throw error;
    });

  return jsZipLoaderPromise;
};

const ensureWebEpubLibrary = () => {
  if (Platform.OS !== "web") {
    return Promise.resolve(null);
  }

  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.ePub) {
    return Promise.resolve(window.ePub);
  }

  if (epubLoaderPromise) {
    return epubLoaderPromise;
  }

  epubLoaderPromise = ensureJsZipGlobal()
    .then(() => {
      return new Promise((resolve, reject) => {
        const onScriptLoad = () => {
          if (window.ePub) {
            resolve(window.ePub);
          } else {
            reject(new Error("EPUB library loaded but window.ePub missing."));
          }
        };

        const onScriptError = () => {
          reject(new Error("Failed to load EPUB library."));
        };

        const existing = document.querySelector('script[data-epubjs]');
        if (existing) {
          if (window.ePub) {
            resolve(window.ePub);
            return;
          }
          existing.addEventListener("load", onScriptLoad, { once: true });
          existing.addEventListener("error", onScriptError, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = EPUB_CDN_URL;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.epubjs = "true";
        script.addEventListener("load", onScriptLoad, { once: true });
        script.addEventListener("error", onScriptError, { once: true });

        document.head.appendChild(script);
      });
    })
    .catch((error) => {
      epubLoaderPromise = null;
      throw error;
    });

  return epubLoaderPromise;
};

const NATIVE_VIEWER_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #000;
        color: #f5f2eb;
        font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overscroll-behavior: contain;
        height: 100%;
        width: 100%;
      }
      #viewer {
        position: absolute;
        inset: 0;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
  </head>
  <body>
    <div id="viewer"></div>
    <script>
      (function() {
        const send = (payload) => {
          try {
            const serialized = JSON.stringify(payload);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(serialized);
            } else if (window.parent && window.parent !== window) {
              window.parent.postMessage(serialized, "*");
            }
          } catch (error) {
            console.warn("[reader] postMessage failed", error);
          }
        };

        let book = null;
        let rendition = null;
        let navigationToc = [];

        const themeStyles = {
          body: {
            background: "#000",
            color: "#f5f2eb",
            fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            lineHeight: "1.65",
            fontSize: "16px",
            padding: "32px 38px 48px",
          },
          p: {
            margin: "0 0 1.2em",
          },
          a: {
            color: "#8bd8ff",
          },
          img: {
            maxWidth: "100%",
            height: "auto",
            display: "block",
            margin: "16px auto",
          },
          h1: {
            lineHeight: "1.3",
            margin: "1.8em 0 1.1em",
          },
          h2: {
            lineHeight: "1.35",
            margin: "1.6em 0 1em",
          },
          h3: {
            lineHeight: "1.4",
            margin: "1.4em 0 0.9em",
          },
        };

        const applyTheme = () => {
          if (!rendition || !rendition.themes) return;
          try {
            rendition.themes.register("night", themeStyles);
            rendition.themes.select("night");
          } catch (error) {
            console.warn("[reader] theme apply failed", error);
          }
        };

        const destroyBook = async () => {
          try {
            if (rendition) {
              rendition.destroy();
            }
          } catch (error) {
            console.warn("[reader] rendition destroy failed", error);
          }
          rendition = null;

          try {
            if (book) {
              await book.destroy();
            }
          } catch (error) {
            console.warn("[reader] book destroy failed", error);
          }
          book = null;
          navigationToc = [];
        };

        const emitLocation = (location) => {
          if (!location) return;
          const navItem = book && book.navigation && book.navigation.get
            ? book.navigation.get(location.start && location.start.href)
            : null;
          send({
            type: "LOCATION_CHANGED",
            payload: {
              start: location.start || null,
              end: location.end || null,
              percentage: typeof location.percentage === "number" ? location.percentage : null,
              displayed: location.displayed || null,
              chapter: navItem ? { label: navItem.label, href: navItem.href } : null,
            },
          });
        };

        const loadBook = async (options) => {
          const data = options && options.data;
          if (!data) {
            return;
          }

          await destroyBook();

          try {
            book = ePub(data, { openAs: "base64" });
          } catch (error) {
            send({ type: "ERROR", payload: error.message || String(error) });
            return;
          }

          rendition = book.renderTo("viewer", {
            width: "100%",
            height: "100%",
            flow: "scrolled-doc",
            spread: "none",
            allowScriptedContent: true,
          });

          applyTheme();

          rendition.on("relocated", (location) => emitLocation(location));
          rendition.on("displayed", () => applyTheme());

          book.ready
            .then(() => {
              send({ type: "READY" });
            })
            .catch((error) => {
              send({ type: "ERROR", payload: error.message || String(error) });
            });

          book.loaded.navigation
            .then((navigation) => {
              navigationToc = (navigation && navigation.toc)
                ? navigation.toc.map((entry) => ({ href: entry.href, label: entry.label }))
                : [];
              send({ type: "TOC", payload: navigationToc });
            })
            .catch((error) => {
              console.warn("[reader] navigation load failed", error);
            });

          try {
            await rendition.display(options && options.initialCfi ? options.initialCfi : undefined);
          } catch (error) {
            send({ type: "ERROR", payload: error.message || String(error) });
          }
        };

        const goToTarget = async (target) => {
          if (!rendition) return;
          try {
            if (typeof target === "string") {
              await rendition.display(target);
            } else if (target && typeof target === "object" && target.href) {
              await rendition.display(target.href);
            }
          } catch (error) {
            send({ type: "ERROR", payload: error.message || String(error) });
          }
        };

        const handleMessage = (event) => {
          let data = event && event.data;
          if (!data) return;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (error) {
              // ignore parse error
            }
          }
          if (!data || !data.type) return;

          switch (data.type) {
            case "LOAD_BOOK":
              loadBook(data.payload);
              break;
            case "NEXT":
              rendition && rendition.next && rendition.next();
              break;
            case "PREVIOUS":
              rendition && rendition.prev && rendition.prev();
              break;
            case "GOTO":
              goToTarget(data.payload);
              break;
            case "SET_THEME":
              applyTheme();
              break;
            case "REQUEST_TOC":
              send({ type: "TOC", payload: navigationToc });
              break;
            default:
              break;
          }
        };

        document.addEventListener("message", handleMessage);
        window.addEventListener("message", handleMessage);

        window.__READER_BRIDGE__ = {
          dispatch: (message) => handleMessage({ data: message }),
        };

        send({ type: "DOM_READY" });
      })();
    </script>
  </body>
</html>`;

const NativeEpubViewer = forwardRef(function NativeEpubViewer(
  { base64, initialCfi, style, onReady, onLocationChange, onToc, onError },
  ref
) {
  const webViewRef = useRef(null);
  const domReadyRef = useRef(false);

  const sendToViewer = useCallback((type, payload) => {
    if (!webViewRef.current || typeof webViewRef.current.injectJavaScript !== "function") {
      return;
    }
    const message = JSON.stringify({ type, payload });
    const script = `window.__READER_BRIDGE__ && window.__READER_BRIDGE__.dispatch(${JSON.stringify(message)}); true;`;
    webViewRef.current.injectJavaScript(script);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      next: () => sendToViewer("NEXT"),
      prev: () => sendToViewer("PREVIOUS"),
      goto: (target) => sendToViewer("GOTO", target),
      requestToc: () => sendToViewer("REQUEST_TOC"),
    }),
    [sendToViewer]
  );

  useEffect(() => {
    if (!domReadyRef.current || !base64) return;
    sendToViewer("LOAD_BOOK", { data: base64, initialCfi });
  }, [base64, initialCfi, sendToViewer]);

  const handleMessage = useCallback(
    (event) => {
      const { data } = event.nativeEvent || {};
      if (!data) return;
      let parsed = null;
      try {
        parsed = JSON.parse(data);
      } catch (error) {
        return;
      }
      if (!parsed || !parsed.type) return;

      switch (parsed.type) {
        case "DOM_READY":
          domReadyRef.current = true;
          if (base64) {
            sendToViewer("LOAD_BOOK", { data: base64, initialCfi });
          }
          break;
        case "READY":
          onReady?.();
          break;
        case "LOCATION_CHANGED":
          onLocationChange?.(parsed.payload || null);
          break;
        case "TOC":
          onToc?.(parsed.payload || []);
          break;
        case "ERROR":
          onError?.(parsed.payload || "Unknown error");
          break;
        default:
          break;
      }
    },
    [base64, initialCfi, onError, onLocationChange, onReady, onToc, sendToViewer]
  );

  if (!WebViewComponent) {
    return null;
  }

  return (
    <WebViewComponent
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html: NATIVE_VIEWER_HTML }}
      onMessage={handleMessage}
      style={[{ flex: 1, backgroundColor: "transparent" }, style]}
      javaScriptEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      mixedContentMode="always"
    />
  );
});

const WebEpubViewer = forwardRef(function WebEpubViewer(
  { arrayBuffer, initialCfi, onReady, onLocationChange, onToc, onError },
  ref
) {
  const containerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  const applyTheme = useCallback(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.themes.register("night", {
        body: {
          background: "#000",
          color: "#f5f2eb",
          fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          lineHeight: "1.65",
          fontSize: "16px",
          padding: "32px 38px 48px",
        },
        p: {
          margin: "0 0 1.2em",
        },
        img: {
          maxWidth: "100%",
          height: "auto",
          display: "block",
          margin: "16px auto",
        },
        a: {
          color: "#8bd8ff",
        },
        h1: {
          lineHeight: "1.3",
          margin: "1.8em 0 1.1em",
        },
        h2: {
          lineHeight: "1.35",
          margin: "1.6em 0 1em",
        },
        h3: {
          lineHeight: "1.4",
          margin: "1.4em 0 0.9em",
        },
      });
      renditionRef.current.themes.select("night");
    } catch (error) {
      console.warn("[reader:web] theme apply failed", error);
    }
  }, []);

  const destroy = useCallback(async () => {
    try {
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
    } catch (error) {
      console.warn("[reader:web] rendition destroy failed", error);
    }
    renditionRef.current = null;

    try {
      if (bookRef.current) {
        await bookRef.current.destroy();
      }
    } catch (error) {
      console.warn("[reader:web] book destroy failed", error);
    }
    bookRef.current = null;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      next: () => renditionRef.current?.next?.(),
      prev: () => renditionRef.current?.prev?.(),
      goto: (target) => {
        if (!renditionRef.current) return;
        if (typeof target === "string") {
          renditionRef.current.display(target);
        } else if (target?.href) {
          renditionRef.current.display(target.href);
        }
      },
      requestToc: () => {
        if (!bookRef.current) return;
        const nav = bookRef.current.navigation;
        if (!nav || !nav.toc) return;
        const toc = nav.toc.map((entry) => ({ href: entry.href, label: entry.label }));
        onToc?.(toc);
      },
    }),
    [onToc]
  );

  useEffect(() => {
    if (!arrayBuffer || !containerRef.current) {
      destroy();
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      await destroy();

      let ePubLib = null;
      try {
        ePubLib = await ensureWebEpubLibrary();
      } catch (error) {
        console.warn("[reader:web] failed to load EPUB library", error);
        onError?.("Unable to load EPUB reader.");
        return;
      }

      if (!ePubLib) {
        onError?.("EPUB reader is unavailable in this environment.");
        return;
      }

      const bookInstance = ePubLib();
      bookRef.current = bookInstance;

      try {
        await bookInstance.open(arrayBuffer, "binary");
      } catch (error) {
        onError?.(error.message || String(error));
        return;
      }

      const rendition = bookInstance.renderTo(containerRef.current, {
        width: "100%",
        height: "100%",
        flow: "scrolled-doc",
        spread: "none",
      });
      renditionRef.current = rendition;

      rendition.on("relocated", (location) => {
        if (cancelled) return;
        const navItem = bookInstance.navigation?.get?.(location.start?.href) ?? null;
        onLocationChange?.({
          start: location.start ?? null,
          end: location.end ?? null,
          percentage: typeof location.percentage === "number" ? location.percentage : null,
          displayed: location.displayed ?? null,
          chapter: navItem ? { label: navItem.label, href: navItem.href } : null,
        });
      });

      bookInstance.loaded.navigation
        .then((navigation) => {
          if (cancelled) return;
          const toc = navigation?.toc?.map((entry) => ({ href: entry.href, label: entry.label })) ?? [];
          onToc?.(toc);
        })
        .catch((error) => {
          console.warn("[reader:web] navigation load failed", error);
        });

      try {
        await rendition.display(initialCfi || undefined);
      } catch (error) {
        onError?.(error.message || String(error));
      }

      applyTheme();
      onReady?.();
    };

    load();

    return () => {
      cancelled = true;
      destroy();
    };
  }, [arrayBuffer, initialCfi, applyTheme, destroy, onError, onLocationChange, onReady, onToc]);

  return <div ref={containerRef} style={{ flex: 1, width: "100%", height: "100%", overflowY: "auto" }} />;
});

export default function BookReaderModal({ book, visible, onClose }) {
  const { getBookRecord, loadProgress, saveProgress } = useLibrary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [progressPercent, setProgressPercent] = useState(null);
  const [toc, setToc] = useState([]);
  const [bookAsset, setBookAsset] = useState(null);
  const [initialCfi, setInitialCfi] = useState(null);
  const recordIdRef = useRef(null);
  const lastSavedPercentRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setBookAsset(null);
      setInitialCfi(null);
      setViewerReady(false);
      setChapterTitle("");
      setProgressPercent(null);
      setToc([]);
      recordIdRef.current = null;
      lastSavedPercentRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !book) return;
    let cancelled = false;

    const loadBook = async () => {
      setLoading(true);
      setError(null);
      setViewerReady(false);
      setBookAsset(null);
      setInitialCfi(null);
      setChapterTitle("");
      setProgressPercent(null);
      setToc([]);

      try {
        const record = getBookRecord(book.contentHash);
        if (!record) {
          throw new Error("Missing EPUB storage path. Run `bun run supabase:sync-epubs` to upload assets.");
        }

        const [buffer, progress] = await Promise.all([downloadBook(record.id), loadProgress(record.id)]);
        if (cancelled) return;

        recordIdRef.current = record.id;

        let base64 = null;
        if (buffer) {
          const uint8 = new Uint8Array(buffer);
          base64 = fromByteArray(uint8);
        }

        const asset = { base64 };
        if (Platform.OS === "web") {
          asset.arrayBuffer = buffer;
        }
        setBookAsset(asset);

        const location = progress?.last_location ?? null;
        const savedCfi =
          typeof location?.cfi === "string"
            ? location.cfi
            : typeof location?.start?.cfi === "string"
            ? location.start.cfi
            : typeof location?.end?.cfi === "string"
            ? location.end.cfi
            : null;
        setInitialCfi(savedCfi);

        if (typeof progress?.percent_complete === "number") {
          lastSavedPercentRef.current = progress.percent_complete;
          setProgressPercent(progress.percent_complete);
        } else if (typeof progress?.percentage === "number") {
          const percent = progress.percentage * 100;
          lastSavedPercentRef.current = percent;
          setProgressPercent(percent);
        } else {
          lastSavedPercentRef.current = null;
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[reader] load error", err);
          setError(err.message || "Unable to load book.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBook();

    return () => {
      cancelled = true;
    };
  }, [visible, book, getBookRecord, loadProgress]);

  const persistProgress = useCallback(
    (location, percent) => {
      const recordId = recordIdRef.current;
      if (!recordId || location == null || typeof percent !== "number") {
        return;
      }

      const lastPercent = lastSavedPercentRef.current;
      if (lastPercent != null && Math.abs(percent - lastPercent) < 1) {
        return;
      }

      lastSavedPercentRef.current = percent;
      const payload = {
        cfi: location?.start?.cfi ?? location?.end?.cfi ?? null,
        start: location?.start ?? null,
        end: location?.end ?? null,
        href: location?.start?.href ?? location?.end?.href ?? null,
      };
      saveProgress(recordId, payload, percent).catch((err) => {
        console.warn("[reader] save progress failed", err);
      });
    },
    [saveProgress]
  );

  const handleLocationChange = useCallback(
    (payload) => {
      if (!payload) return;
      if (payload.chapter?.label) {
        setChapterTitle(payload.chapter.label);
      }
      const percent =
        typeof payload.percentage === "number"
          ? Math.max(0, Math.min(100, payload.percentage * 100))
          : null;
      if (percent !== null) {
        setProgressPercent(percent);
        persistProgress(payload, percent);
      }
    },
    [persistProgress]
  );

  const handleReady = useCallback(() => {
    setViewerReady(true);
  }, []);

  const handleToc = useCallback((entries) => {
    if (Array.isArray(entries)) {
      setToc(entries);
    }
  }, []);

  const handleReaderError = useCallback((message) => {
    if (message) {
      setError(message);
    }
  }, []);

  const goToNext = useCallback(() => {
    viewerRef.current?.next?.();
  }, []);

  const goToPrevious = useCallback(() => {
    viewerRef.current?.prev?.();
  }, []);

  const closeReader = useCallback(() => {
    setBookAsset(null);
    setInitialCfi(null);
    setViewerReady(false);
    setChapterTitle("");
    setProgressPercent(null);
    setToc([]);
    recordIdRef.current = null;
    lastSavedPercentRef.current = null;
    onClose();
  }, [onClose]);

  const disableControls = loading || !!error || !viewerReady || !bookAsset;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : "overFullScreen"}
      onRequestClose={closeReader}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.bookTitle}>{book?.title}</Text>
            <Text style={styles.bookMeta}>
              {chapterTitle || "Scrolling"}
              {progressPercent != null ? ` · ${Math.round(progressPercent)}%` : ""}
            </Text>
          </View>
          <Pressable onPress={closeReader} style={styles.iconButton}>
            <Feather name="x" size={24} color="#f5f2eb" />
          </Pressable>
        </View>

        <View style={styles.readerShell}>
          <Pressable
            style={[styles.arrowButton, disableControls && styles.arrowDisabled]}
            onPress={goToPrevious}
            disabled={disableControls}
            accessibilityRole="button"
            accessibilityLabel="Previous section"
          >
            <Feather name="chevron-left" size={28} color="#f5f2eb" />
          </Pressable>

          <View style={styles.readerSurface}>
            {loading && !bookAsset ? (
              <View style={styles.center}>
                <ActivityIndicator color="#f5f2eb" />
                <Text style={styles.loadingText}>Opening book…</Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <Text style={styles.errorTitle}>Unable to open book</Text>
                <Text style={styles.errorBody}>{error}</Text>
              </View>
            ) : bookAsset ? (
              Platform.OS === "web" ? (
                <WebEpubViewer
                  ref={viewerRef}
                  arrayBuffer={bookAsset.arrayBuffer}
                  initialCfi={initialCfi}
                  onReady={handleReady}
                  onLocationChange={handleLocationChange}
                  onToc={handleToc}
                  onError={handleReaderError}
                />
              ) : (
                <NativeEpubViewer
                  ref={viewerRef}
                  base64={bookAsset.base64}
                  initialCfi={initialCfi}
                  onReady={handleReady}
                  onLocationChange={handleLocationChange}
                  onToc={handleToc}
                  onError={handleReaderError}
                />
              )
            ) : (
              <View style={styles.center}>
                <Text style={styles.errorBody}>No book data available.</Text>
              </View>
            )}

            {!viewerReady && !error && bookAsset ? (
              <View style={styles.overlayLoading} pointerEvents="none">
                <ActivityIndicator color="#f5f2eb" />
                <Text style={styles.loadingText}>Rendering…</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            style={[styles.arrowButton, disableControls && styles.arrowDisabled]}
            onPress={goToNext}
            disabled={disableControls}
            accessibilityRole="button"
            accessibilityLabel="Next section"
          >
            <Feather name="chevron-right" size={28} color="#f5f2eb" />
          </Pressable>
        </View>

        {toc.length > 1 ? (
          <View style={styles.tocHint}>
            <Text style={styles.tocHintText}>{toc.length} sections available</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  bookTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: "#f5f2eb",
  },
  bookMeta: {
    fontSize: theme.fontSizes.sm,
    color: "rgba(245,242,235,0.7)",
    marginTop: 4,
    fontFamily: theme.fonts.text,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  readerShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.lg,
  },
  arrowButton: {
    width: 48,
    height: "100%",
    borderRadius: theme.borderRadius.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  readerSurface: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: "#f5f2eb",
    fontFamily: theme.fonts.text,
    marginTop: 4,
  },
  errorTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.heading,
    marginBottom: theme.spacing.sm,
    color: "#f9dede",
    textAlign: "center",
  },
  errorBody: {
    fontFamily: theme.fonts.text,
    color: "rgba(249,222,222,0.75)",
    textAlign: "center",
    paddingHorizontal: theme.spacing.md,
  },
  overlayLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  tocHint: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  tocHintText: {
    color: "rgba(245,242,235,0.6)",
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.xs,
    letterSpacing: 0.4,
  },
});

