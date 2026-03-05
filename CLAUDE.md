# RecipeCards — Claude Instructions

## Modal Design Standard

**All modals in this app must follow this design standard.** Never use `Alert.alert` for user-facing confirmations or action sheets — always build a custom modal component.

### Spec
| Token | Value |
|---|---|
| Background | `#F7F5F2` (warm off-white) |
| Overlay | `rgba(0,0,0,0.65)` |
| Border radius | `24` |
| Padding | `32` |
| Gap | `16` |
| Animation | `Animated.timing` fade + `translateY` slide-in (duration 220ms, `useNativeDriver: true`) |

### Typography
| Role | Font | Size | Color |
|---|---|---|---|
| Title | `PlayfairDisplay_700Bold` | 26 | `#1C1917` |
| Body | `DMSans_400Regular` | 15, lineHeight 24 | `#78716C` |
| Primary btn | `DMSans_600SemiBold` | 15 | `#F7F5F2` |
| Cancel | `DMSans_500Medium` | 14 | `#A8A29E` |

### Buttons
- **Primary**: `backgroundColor: '#1C1917'`, `borderRadius: 100` (pill), `height: 54`, `marginTop: 8`
- **Destructive**: same shape, `backgroundColor: '#DC2626'`
- **Secondary/outline**: same shape, `borderWidth: 1.5`, `borderColor: '#E7E5E4'`, transparent bg
- **Cancel**: plain text, `paddingVertical: 16`, centered — no border, no background

### Reference implementations
- `src/components/PublishConfirmModal.tsx`
- `src/components/PhotoPickerModal.tsx`
- `src/components/DeleteConfirmModal.tsx`
