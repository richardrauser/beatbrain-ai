'use client';
import { MusicFactPopup } from './MusicFactPopup';
import { useMusicFact } from './MusicFactContext';

export function GlobalMusicFactPopup() {
    const { isOpen, hideFact } = useMusicFact();
    return <MusicFactPopup isOpen={isOpen} onClose={hideFact} />;
}
