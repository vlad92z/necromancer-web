
export const SOLO_RUN_CONFIG = {
    /**
     * Overload helpers - maps game number to overload damage per rune.
     */
    overloadDamageProgression: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 50, 60, 70, 80, 90, 100,
    ],

    /**
     * Target score will be multiplied by game number.
     */
    baseTargetScore: 1,

    playerId: 'player-1',
    playerName: 'Arcane Apprentice',
    startingHealth: 100,
    startingArmor: 0,

    wallSize: 6,
    runeforgeCount: 5,
    runeforgeCapacity: 4,
}
