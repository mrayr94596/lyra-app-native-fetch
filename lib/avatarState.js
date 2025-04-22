// lib/avatarState.js

export const AvatarState = {
  pose: 'neutral-standing',
  mood: 'calm',
  outfit: 'casual-blue',
  location: 'default-studio',
  expression: 'neutral',
};

let currentAvatarState = { ...AvatarState };

export function getAvatarState() {
  return currentAvatarState;
}

export function updateAvatarState(partialUpdate) {
  currentAvatarState = { ...currentAvatarState, ...partialUpdate };
}
