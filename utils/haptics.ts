import * as Haptics from 'expo-haptics';

export async function hapticComplete() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function hapticTap() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticHeavy() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function hapticCelebrate() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise((r) => setTimeout(r, 120));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise((r) => setTimeout(r, 80));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
