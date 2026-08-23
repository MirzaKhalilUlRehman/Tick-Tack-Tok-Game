/**
 * Dedicated Ludo Game Page Route
 * Directly hosts or joins Ludo matches with synchronized state.
 */
import React from 'react';
import RoomPage from './RoomPage';

export default function LudoGamePage({ profile }) {
  return <RoomPage profile={profile} />;
}
