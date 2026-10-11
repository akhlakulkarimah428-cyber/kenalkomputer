/**
 * KEYBOARD FORCE — THE LOST FILES
 * Full 2D Educational RPG Game Engine
 * HTML5 Canvas + Vanilla JavaScript (ES6) + Web Audio API
 *
 * PHASES IMPLEMENTED:
 * Phase 1: Core Engine, Movement, Collisions, Dialogues, Audio Synthesizer
 * Phase 2: Refinement of Inventory, Quests, Typing & Sorting Puzzles
 * Phase 3: Multiple Distinct Areas, Campfire Checkpoints (localStorage),
 *          Secret Room (.secret_vault), Final Boss (File Dragon)
 * Phase 4: Polish, Dynamic Zone Banners, Boss Animations, Victory Flow
 */

(function () {
  'use strict';

  // ===================================================
  // 1. SOUND MANAGER (Web Audio API Synthesizer)
  // ===================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playAttack() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playSuccess() {
      // Arpeggio C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((note, i) => {
        setTimeout(() => this.playTone(note, 'triangle', 0.18, 0.18), i * 75);
      });
    }

    playError() {
      this.playTone(130, 'sawtooth', 0.22, 0.22);
    }

    playLevelUp() {
      const fanfare = [392, 523, 659, 784, 1046];
      fanfare.forEach((n, i) => {
        setTimeout(() => this.playTone(n, 'sine', 0.28, 0.22), i * 90);
      });
    }

    playPickup() {
      this.playTone(880, 'sine', 0.1, 0.15);
      setTimeout(() => this.playTone(1320, 'sine', 0.15, 0.15), 60);
    }

    playCampfire() {
      this.playTone(330, 'triangle', 0.3, 0.18);
      setTimeout(() => this.playTone(493.88, 'triangle', 0.3, 0.18), 120);
    }

    playDragonRoar() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    }

    playBossHit() {
      this.playTone(90, 'square', 0.2, 0.25);
    }

    playSecretUnlock() {
      const chime = [659, 784, 988, 1318];
      chime.forEach((note, i) => {
        setTimeout(() => this.playTone(note, 'sine', 0.25, 0.2), i * 80);
      });
    }

    playVictory() {
      const victoryTune = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      victoryTune.forEach((note, i) => {
        setTimeout(() => this.playTone(note, 'triangle', 0.35, 0.25), i * 110);
      });
    }
  }

  const sound = new SoundManager();

  // ===================================================
  // 2. FINGER MAPPING & EDUCATIONAL DATA
  // ===================================================
  const FINGER_MAP = {
    'Q': { finger: 'Jari Kelingking Kiri (Left Pinky)', row: 'Top Row', tip: 'Gunakan kelingking kiri.' },
    'A': { finger: 'Jari Kelingking Kiri (Left Pinky)', row: 'Home Row', tip: 'Kelingking kiri istirahat di tombol A pada Home Row!' },
    'Z': { finger: 'Jari Kelingking Kiri (Left Pinky)', row: 'Bottom Row', tip: 'Kelingking kiri turun dari A ke Z.' },

    'W': { finger: 'Jari Manis Kiri (Left Ring)', row: 'Top Row', tip: 'Jari manis kiri naik ke W.' },
    'S': { finger: 'Jari Manis Kiri (Left Ring)', row: 'Home Row', tip: 'Jari manis kiri beristirahat di S pada Home Row.' },
    'X': { finger: 'Jari Manis Kiri (Left Ring)', row: 'Bottom Row', tip: 'Jari manis kiri turun ke X.' },

    'E': { finger: 'Jari Tengah Kiri (Left Middle)', row: 'Top Row', tip: 'Jari tengah kiri naik dari D ke E.' },
    'D': { finger: 'Jari Tengah Kiri (Left Middle)', row: 'Home Row', tip: 'Jari tengah kiri beristirahat di D pada Home Row.' },
    'C': { finger: 'Jari Tengah Kiri (Left Middle)', row: 'Bottom Row', tip: 'Jari tengah kiri turun ke C.' },

    'R': { finger: 'Jari Telunjuk Kiri (Left Index)', row: 'Top Row', tip: 'Telunjuk kiri naik ke R.' },
    'F': { finger: 'Jari Telunjuk Kiri (Left Index)', row: 'Home Row', tip: 'Telunjuk kiri beristirahat di F (ada tonjolan tactile/bump)!' },
    'V': { finger: 'Jari Telunjuk Kiri (Left Index)', row: 'Bottom Row', tip: 'Telunjuk kiri turun ke V.' },
    'T': { finger: 'Jari Telunjuk Kiri (Left Index)', row: 'Top Row', tip: 'Telunjuk kiri bergeser ke kanan atas untuk T.' },
    'G': { finger: 'Jari Telunjuk Kiri (Left Index)', row: 'Home Row', tip: 'Telunjuk kiri bergeser ke kanan untuk G.' },
    'B': { finger: 'Jari Telunjuk Kiri (Left Index)', row: 'Bottom Row', tip: 'Telunjuk kiri turun ke kanan untuk B.' },

    'Y': { finger: 'Jari Telunjuk Kanan (Right Index)', row: 'Top Row', tip: 'Telunjuk kanan menjangkau Y.' },
    'U': { finger: 'Jari Telunjuk Kanan (Right Index)', row: 'Top Row', tip: 'Telunjuk kanan naik ke U.' },
    'H': { finger: 'Jari Telunjuk Kanan (Right Index)', row: 'Home Row', tip: 'Telunjuk kanan bergeser ke kiri untuk H.' },
    'J': { finger: 'Jari Telunjuk Kanan (Right Index)', row: 'Home Row', tip: 'Telunjuk kanan beristirahat di J (ada tonjolan tactile/bump)!' },
    'N': { finger: 'Jari Telunjuk Kanan (Right Index)', row: 'Bottom Row', tip: 'Telunjuk kanan turun ke N.' },
    'M': { finger: 'Jari Telunjuk Kanan (Right Index)', row: 'Bottom Row', tip: 'Telunjuk kanan turun ke M.' },

    'I': { finger: 'Jari Tengah Kanan (Right Middle)', row: 'Top Row', tip: 'Jari tengah kanan naik ke I.' },
    'K': { finger: 'Jari Tengah Kanan (Right Middle)', row: 'Home Row', tip: 'Jari tengah kanan beristirahat di K pada Home Row.' },

    'O': { finger: 'Jari Manis Kanan (Right Ring)', row: 'Top Row', tip: 'Jari manis kanan naik ke O.' },
    'L': { finger: 'Jari Manis Kanan (Right Ring)', row: 'Home Row', tip: 'Jari manis kanan beristirahat di L pada Home Row.' },

    'P': { finger: 'Jari Kelingking Kanan (Right Pinky)', row: 'Top Row', tip: 'Kelingking kanan naik ke P.' },
    ';': { finger: 'Jari Kelingking Kanan (Right Pinky)', row: 'Home Row', tip: 'Kelingking kanan beristirahat di titik koma (;).' }
  };

  const SHORTCUT_CHALLENGES = [
    {
      title: "Membuka Gerbang File Explorer",
      lore: "Pintu gerbang kuno terkunci oleh mantra berkas. Shortcut mana yang digunakan untuk membuka File Explorer di Windows?",
      options: [
        { text: "Ctrl + C", isCorrect: false, explanation: "Ctrl + C berfungsi untuk Menyalin (Copy) berkas atau teks." },
        { text: "Win + E", isCorrect: true, explanation: "Tepat sekali! Tombol Windows + E membuka jendela File Explorer secara instan!" },
        { text: "F2", isCorrect: false, explanation: "F2 berfungsi untuk Mengubah Nama (Rename) berkas." },
        { text: "Ctrl + Z", isCorrect: false, explanation: "Ctrl + Z berfungsi untuk Membatalkan aksi (Undo)." }
      ]
    },
    {
      title: "Mantra Pemindah Berkas (Cut & Move)",
      lore: "Untuk memindahkan berkas secara permanen ke folder lain tanpa meninggalkan duplikat aslinya, pasangan mantra apa yang tepat?",
      options: [
        { text: "Ctrl + C lalu Ctrl + V", isCorrect: false, explanation: "Itu adalah Copy + Paste (menghasilkan duplikasi, bukan memindahkan)." },
        { text: "Ctrl + X lalu Ctrl + V", isCorrect: true, explanation: "Benar! Cut (Ctrl+X) memotong berkas, dan Paste (Ctrl+V) meletakkannya di tujuan!" },
        { text: "Ctrl + A lalu Delete", isCorrect: false, explanation: "Itu akan memilih semua dan menghapusnya!" },
        { text: "Ctrl + S lalu F5", isCorrect: false, explanation: "Itu adalah Save dan Refresh." }
      ]
    },
    {
      title: "Mantra Mengubah Nama Berkas (Rename)",
      lore: "Sebelum mempersembahkan berkas kepada Raja Berkas, namanya harus diubah dengan cepat. Tombol ajaib apa di baris atas keyboard?",
      options: [
        { text: "F1", isCorrect: false, explanation: "F1 biasanya digunakan untuk membuka menu Bantuan (Help)." },
        { text: "F2", isCorrect: true, explanation: "Sempurna! F2 adalah tombol universal untuk Me-Rename (mengubah nama) berkas!" },
        { text: "F5", isCorrect: false, explanation: "F5 digunakan untuk memuat ulang (Refresh) tampilan." },
        { text: "Esc", isCorrect: false, explanation: "Esc (Escape) membatalkan aksi yang sedang berjalan." }
      ]
    },
    {
      title: "Mantra Pembatal Kesalahan (Undo Magic)",
      lore: "Jika kamu tidak sengaja menghapus teks atau memindahkan berkas yang salah, mantra apa yang dapat membatalkan kesalahan tersebut?",
      options: [
        { text: "Ctrl + Z", isCorrect: true, explanation: "Luar biasa! Ctrl + Z adalah Undo, membalikkan kesalahan aksi terakhir!" },
        { text: "Ctrl + Y", isCorrect: false, explanation: "Ctrl + Y adalah Redo (mengulangi aksi yang di-undo)." },
        { text: "Alt + Tab", isCorrect: false, explanation: "Alt + Tab berpindah antar jendela program." },
        { text: "Ctrl + P", isCorrect: false, explanation: "Ctrl + P adalah Print (mencetak dokumen)." }
      ]
    }
  ];

  const ARCHIVE_FILES = [
    {
      name: "Laporan-IPA.docx",
      ext: ".docx",
      targetFolder: "Documents",
      icon: "📄",
      hint: "Berkas dokumen teks Microsoft Word untuk laporan tugas sekolah."
    },
    {
      name: "FotoWisuda.jpg",
      ext: ".jpg",
      targetFolder: "Pictures",
      icon: "🖼️",
      hint: "Format kompresi gambar foto digital."
    },
    {
      name: "Soundtrack-Dungeon.mp3",
      ext: ".mp3",
      targetFolder: "Music",
      icon: "🎵",
      hint: "Berkas audio rekaman musik digital standar."
    },
    {
      name: "Video-Kenangan.mp4",
      ext: ".mp4",
      targetFolder: "Videos",
      icon: "🎬",
      hint: "Format berkas rekaman video multimedia bergerak dan bersuara."
    },
    {
      name: "GameLogic.py",
      ext: ".py",
      targetFolder: "Projects",
      icon: "🐍",
      hint: "Berkas skrip pemrograman bahasa Python untuk aplikasi dan proyek."
    },
    {
      name: "Presentasi-Sejarah.pptx",
      ext: ".pptx",
      targetFolder: "Documents",
      icon: "📊",
      hint: "Berkas tayangan slide presentasi Microsoft PowerPoint."
    },
    {
      name: "Backup-Arsip.zip",
      ext: ".zip",
      targetFolder: "Projects",
      icon: "🗜️",
      hint: "Berkas arsip terkompresi berisi kumpulan berkas yang dipadatkan."
    },
    {
      name: "BukuPanduan.pdf",
      ext: ".pdf",
      targetFolder: "Documents",
      icon: "📑",
      hint: "Portable Document Format (dokumen digital universal siap baca)."
    }
  ];

  // ===================================================
  // 3. GAME STATE & CHECKPOINT SAVE SYSTEM
  // ===================================================
  const SAVE_KEY = 'KEYBOARD_FORCE_THE_LOST_FILES_SAVE_V2';

  const defaultGameState = {
    player: {
      x: 320,
      y: 420,
      width: 28,
      height: 36,
      speed: 3.6,
      dir: 'down',
      frame: 0,
      animTimer: 0,
      hp: 100,
      maxHp: 100,
      exp: 0,
      maxExp: 100,
      level: 1,
      crystals: 0
    },
    inventory: [
      { id: 'rusty_key', name: 'Rusty Key', icon: '🗝️', desc: 'Kunci berkarat dari desa lama.' },
      { id: 'note', name: 'Ancient Note', icon: '📄', desc: 'Catatan posisi jari: ASDF - JKL;' },
      { id: 'sword', name: 'Data Sword', icon: '⚔️', desc: 'Pedang ketikan untuk melumpuhkan bug.' }
    ],
    quests: [
      {
        id: 'q1',
        title: 'Master the Home Row',
        desc: 'Bicara dengan Typing Master Alden dan kuasai 5 tombol Home Row.',
        progress: 0,
        total: 5,
        completed: false,
        reward: '+60 EXP, Crystal Fragment'
      },
      {
        id: 'q2',
        title: 'Cleansing the Letter Forest',
        desc: 'Kalahkan monster Corrupt Byte dan Bit Wolf di Hutan Huruf.',
        progress: 0,
        total: 2,
        completed: false,
        reward: '+100 EXP, Data Shard'
      },
      {
        id: 'q3',
        title: 'The Explorer Gate Seal',
        desc: 'Pecahkan teka-teki shortcut di depan gerbang gua kuno.',
        progress: 0,
        total: 1,
        completed: false,
        reward: '+80 EXP, Cave Access'
      },
      {
        id: 'q4',
        title: 'Ancient Library Archive',
        desc: 'Kelompokkan berkas sesuai ekstensi ke folder yang tepat.',
        progress: 0,
        total: 6,
        completed: false,
        reward: '+120 EXP, Master Crystal'
      },
      {
        id: 'q5',
        title: 'The Secret Vault (.secret_vault)',
        desc: 'Temukan folder tersembunyi di gua menggunakan Kunci Folder / shortcut.',
        progress: 0,
        total: 1,
        completed: false,
        reward: '+100 EXP, Golden Rune Keycap'
      },
      {
        id: 'q6',
        title: 'Slay the Corrupt File Dragon',
        desc: 'Kalahkan Sang Naga Berkas Corrupted di Sarang Naga Berkas.',
        progress: 0,
        total: 1,
        completed: false,
        reward: '+250 EXP, Final Restored Crystal'
      }
    ],
    unlockedGates: {
      explorerGate: false,
      secretRoom: false
    },
    openedChests: {},
    talkedNpcs: {},
    defeatedBoss: false
  };

  let gameState = JSON.parse(JSON.stringify(defaultGameState));

  function loadGameSave() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        gameState = Object.assign({}, defaultGameState, parsed);
        return true;
      }
    } catch (e) {
      console.warn('Could not load save:', e);
    }
    return false;
  }

  function saveGameProgress(notification = true) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      if (notification) {
        showToast('🔥 Checkpoint Tersimpan ke Batu Api!');
        sound.playCampfire();
      }
    } catch (e) {
      console.warn('Could not save:', e);
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerHTML = `<span>✨</span> <span>${msg}</span>`;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  }

  // ===================================================
  // 4. WORLD MAP, MULTIPLE AREAS & ENTITIES
  // ===================================================
  const WORLD_WIDTH = 2600;
  const WORLD_HEIGHT = 1700;

  // Static Obstacles (boundaries, houses, trees, walls, shelves, lava pits)
  const OBSTACLES = [
    // World boundary walls
    { x: 0, y: 0, w: WORLD_WIDTH, h: 40 },
    { x: 0, y: WORLD_HEIGHT - 40, w: WORLD_WIDTH, h: 40 },
    { x: 0, y: 0, w: 40, h: WORLD_HEIGHT },
    { x: WORLD_WIDTH - 40, y: 0, w: 40, h: WORLD_HEIGHT },

    // Zone 1: Village (North-West)
    { x: 120, y: 160, w: 180, h: 120, type: 'house', label: 'Cottage' },
    { x: 440, y: 160, w: 180, h: 120, type: 'house', label: 'Typing Hall' },
    { x: 100, y: 320, w: 220, h: 20, type: 'fence' },
    { x: 420, y: 320, w: 220, h: 20, type: 'fence' },

    // Zone 2: Forest of Letters (Central North)
    { x: 780, y: 60, w: 60, h: 420, type: 'trees' },
    { x: 880, y: 220, w: 80, h: 80, type: 'ruins' },
    { x: 1120, y: 160, w: 120, h: 100, type: 'ruins' },
    { x: 920, y: 460, w: 180, h: 60, type: 'trees' },
    { x: 1300, y: 320, w: 70, h: 260, type: 'trees' },

    // Zone 3: Shortcut Cavern (South-West)
    { x: 80, y: 780, w: 340, h: 50, type: 'stone_wall' },
    { x: 500, y: 780, w: 340, h: 50, type: 'stone_wall' },
    { x: 80, y: 1120, w: 680, h: 40, type: 'stone_wall' },
    { x: 840, y: 920, w: 60, h: 520, type: 'stone_wall' },

    // Zone 4: Ancient Library Archives (North-East)
    { x: 1560, y: 40, w: 40, h: 680, type: 'library_wall' },
    { x: 1600, y: 720, w: 560, h: 40, type: 'library_wall' },
    { x: 1840, y: 160, w: 200, h: 90, type: 'archive_shelf' },
    { x: 1840, y: 340, w: 200, h: 90, type: 'archive_shelf' },
    { x: 1840, y: 520, w: 200, h: 90, type: 'archive_shelf' },

    // Zone 5: Secret Vault Boundary
    { x: 1400, y: 1260, w: 420, h: 30, type: 'stone_wall' },
    { x: 1400, y: 1260, w: 30, h: 380, type: 'stone_wall' },

    // Zone 6: File Dragon's Corrupt Lair (South-East)
    { x: 1880, y: 840, w: 40, h: 800, type: 'lava_wall' },
    { x: 2160, y: 1040, w: 100, h: 100, type: 'corrupt_pillar' },
    { x: 2420, y: 1360, w: 90, h: 90, type: 'corrupt_pillar' }
  ];

  // Dynamic Entities in the World
  const ENTITIES = [
    // Village Campfire (Desa Baris Beranda)
    {
      id: 'camp_village',
      type: 'campfire',
      x: 350,
      y: 380,
      w: 40,
      h: 40,
      title: 'Batu Api Desa',
      hint: '[ E ] Istirahat & Simpan Checkpoint (Desa)'
    },
    // Forest Campfire (Hutan Huruf)
    {
      id: 'camp_forest',
      type: 'campfire',
      x: 1140,
      y: 560,
      w: 40,
      h: 40,
      title: 'Batu Api Hutan',
      hint: '[ E ] Istirahat & Simpan Checkpoint (Hutan)'
    },
    // Cavern Campfire (Gua Gerbang Shortcut)
    {
      id: 'camp_cavern',
      type: 'campfire',
      x: 480,
      y: 1240,
      w: 40,
      h: 40,
      title: 'Batu Api Gua',
      hint: '[ E ] Istirahat & Simpan Checkpoint (Gua)'
    },
    // Dragon Lair Campfire (Sarang Naga Berkas)
    {
      id: 'camp_dragon',
      type: 'campfire',
      x: 1980,
      y: 1100,
      w: 40,
      h: 40,
      title: 'Batu Api Sarang Naga',
      hint: '[ E ] Istirahat & Simpan Checkpoint (Boss Prep)'
    },

    // NPCs
    {
      id: 'npc_master',
      type: 'npc',
      x: 530,
      y: 310,
      w: 36,
      h: 44,
      name: 'Typing Master Alden',
      avatar: '🧙‍♂️',
      title: 'Tetua Baris Beranda',
      hint: '[ E ] Bicara dengan Guru Ketik Alden'
    },
    {
      id: 'npc_gatekeeper',
      type: 'gatekeeper',
      x: 420,
      y: 770,
      w: 44,
      h: 48,
      name: 'Gatekeeper Cipher',
      avatar: '🛡️',
      hint: '[ E ] Hadapi Ujian Gerbang Penjelajah'
    },
    {
      id: 'npc_archivist',
      type: 'archivist',
      x: 1720,
      y: 280,
      w: 40,
      h: 44,
      name: 'Archivist Eldred',
      avatar: '🦉',
      title: 'Pustakawan Arsip Kerajaan',
      hint: '[ E ] Bantu Merapikan Berkas Arsip'
    },

    // Roaming Monsters (Forest of Letters)
    {
      id: 'monster_goblin_1',
      type: 'monster',
      x: 960,
      y: 320,
      w: 36,
      h: 40,
      name: 'Byte Goblin',
      avatar: '👺',
      hp: 100,
      maxHp: 100,
      defeated: false,
      words: ['F', 'J', 'D', 'K', 'CAT', 'FILE'],
      hint: '[ E ] Serang Byte Goblin!'
    },
    {
      id: 'monster_specter_2',
      type: 'monster',
      x: 1240,
      y: 380,
      w: 36,
      h: 40,
      name: 'Corrupt Specter',
      avatar: '👾',
      hp: 120,
      maxHp: 120,
      defeated: false,
      words: ['R', 'U', 'S', 'L', 'SAVE', 'COPY', 'BYTE'],
      hint: '[ E ] Serang Corrupt Specter!'
    },
    {
      id: 'monster_bitwolf',
      type: 'monster',
      x: 1420,
      y: 220,
      w: 36,
      h: 40,
      name: 'Bit Wolf',
      avatar: '🐺',
      hp: 130,
      maxHp: 130,
      defeated: false,
      words: ['SHIFT', 'ENTER', 'SPACE', 'ALT', 'TAB'],
      hint: '[ E ] Serang Bit Wolf!'
    },

    // Chests
    {
      id: 'chest_village',
      type: 'chest',
      x: 150,
      y: 280,
      w: 36,
      h: 32,
      opened: false,
      content: { id: 'folder_key', name: 'Folder Key', icon: '🗝️', desc: 'Kunci untuk membuka direktori tersembunyi.' },
      hint: '[ E ] Buka Peti Kayu Desa'
    },
    {
      id: 'chest_library',
      type: 'chest',
      x: 2050,
      y: 160,
      w: 36,
      h: 32,
      opened: false,
      content: { id: 'crystal_library', name: 'Pecahan Crystal of Knowledge', icon: '💎', desc: 'Pecahan kristal suci pengetahuan komputer.' },
      hint: '[ E ] Buka Peti Emas Pustaka'
    },

    // Secret Room Portal
    {
      id: 'ent_secret_gate',
      type: 'secret_portal',
      x: 1440,
      y: 1340,
      w: 48,
      h: 48,
      name: 'Segel Folder Rahasia',
      hint: '[ E ] Periksa Segel Folder Rahasia (.secret_vault)'
    },

    // Final Boss: FILE DRAGON
    {
      id: 'ent_file_dragon',
      type: 'boss',
      x: 2320,
      y: 1200,
      w: 64,
      h: 64,
      name: 'File Dragon (Boss Akhir)',
      avatar: '🐉',
      defeated: false,
      hint: '[ E ] TANTANG FILE DRAGON (BOSS AKHIR)!'
    }
  ];

  // Floating text particles (+EXP, damage, etc.)
  const floatingTexts = [];

  function addFloatingText(x, y, text, color = '#00e5ff') {
    floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      life: 55
    });
  }

  // ===================================================
  // 5. INPUT CONTROLLER & OVERLAYS
  // ===================================================
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    e: false
  };

  let currentInteractingEntity = null;
  let activeOverlay = null; // 'dialogue', 'tutorial', 'combat', 'shortcut', 'file_puzzle', 'inventory', 'quests', 'boss', 'secret_room', 'victory'
  let currentZoneName = '';

  window.addEventListener('keydown', (e) => {
    sound.init();

    // Specific modal handlers
    if (activeOverlay === 'boss') {
      handleBossKeypress(e);
      return;
    }
    if (activeOverlay === 'tutorial') {
      handleTutorialKeypress(e);
      return;
    }
    if (activeOverlay === 'combat') {
      handleCombatKeypress(e);
      return;
    }
    if (activeOverlay === 'dialogue') {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
        advanceDialogue();
        e.preventDefault();
      }
      return;
    }

    if (e.key in keys) {
      keys[e.key] = true;
    }
    if (e.key === 'W' || e.key === 'w') keys.w = true;
    if (e.key === 'A' || e.key === 'a') keys.a = true;
    if (e.key === 'S' || e.key === 's') keys.s = true;
    if (e.key === 'D' || e.key === 'd') keys.d = true;

    // Interaction key E
    if ((e.key === 'e' || e.key === 'E') && !activeOverlay) {
      triggerInteraction();
    }

    // Hotkeys for Inventory & Quests
    if ((e.key === 'i' || e.key === 'I') && !activeOverlay) {
      openInventoryModal();
    }
    if ((e.key === 'q' || e.key === 'Q') && !activeOverlay) {
      openQuestModal();
    }
    if (e.key === 'Escape' && activeOverlay) {
      closeCurrentOverlay();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
      keys[e.key] = false;
    }
    if (e.key === 'W' || e.key === 'w') keys.w = false;
    if (e.key === 'A' || e.key === 'a') keys.a = false;
    if (e.key === 'S' || e.key === 's') keys.s = false;
    if (e.key === 'D' || e.key === 'd') keys.d = false;
  });

  function setupVirtualControls() {
    const dpadUp = document.getElementById('v-up');
    const dpadDown = document.getElementById('v-down');
    const dpadLeft = document.getElementById('v-left');
    const dpadRight = document.getElementById('v-right');
    const btnInteract = document.getElementById('v-interact');

    const bindBtn = (el, keyName) => {
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; });
      el.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); keys[keyName] = true; });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); keys[keyName] = false; });
    };

    bindBtn(dpadUp, 'ArrowUp');
    bindBtn(dpadDown, 'ArrowDown');
    bindBtn(dpadLeft, 'ArrowLeft');
    bindBtn(dpadRight, 'ArrowRight');

    if (btnInteract) {
      btnInteract.addEventListener('click', () => {
        if (activeOverlay === 'dialogue') {
          advanceDialogue();
        } else if (!activeOverlay) {
          triggerInteraction();
        }
      });
    }
  }

  // ===================================================
  // 6. ZONE ANNOUNCEMENT BANNER
  // ===================================================
  let zoneBannerTimeout = null;

  function triggerZoneAnnouncement(title, subtitle) {
    const banner = document.getElementById('zone-banner');
    const titleEl = document.getElementById('zone-banner-title');
    const subEl = document.getElementById('zone-banner-sub');
    if (!banner || !titleEl) return;

    titleEl.textContent = title;
    subEl.textContent = subtitle;

    banner.classList.add('active');
    clearTimeout(zoneBannerTimeout);
    zoneBannerTimeout = setTimeout(() => {
      banner.classList.remove('active');
    }, 3200);
  }

  // ===================================================
  // 7. GAME LOOP & CANVAS RENDERING
  // ===================================================
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  let camera = { x: 0, y: 0, w: 800, h: 600 };

  function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (!container || !canvas) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    camera.w = canvas.width;
    camera.h = canvas.height;
  }

  window.addEventListener('resize', resizeCanvas);

  function checkCollision(x, y, w, h) {
    // Check World Obstacles
    for (const obs of OBSTACLES) {
      if (
        x < obs.x + obs.w &&
        x + w > obs.x &&
        y < obs.y + obs.h &&
        y + h > obs.y
      ) {
        return true;
      }
    }
    // Check Explorer Gate status
    if (!gameState.unlockedGates.explorerGate) {
      const gateObstacle = { x: 420, y: 770, w: 80, h: 30 };
      if (
        x < gateObstacle.x + gateObstacle.w &&
        x + w > gateObstacle.x &&
        y < gateObstacle.y + gateObstacle.h &&
        y + h > gateObstacle.y
      ) {
        return true;
      }
    }
    return false;
  }

  function updatePlayer() {
    if (activeOverlay) return; // Freeze during modals

    let dx = 0;
    let dy = 0;

    if (keys.w || keys.ArrowUp) { dy -= 1; gameState.player.dir = 'up'; }
    if (keys.s || keys.ArrowDown) { dy += 1; gameState.player.dir = 'down'; }
    if (keys.a || keys.ArrowLeft) { dx -= 1; gameState.player.dir = 'left'; }
    if (keys.d || keys.ArrowRight) { dx += 1; gameState.player.dir = 'right'; }

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const p = gameState.player;
    const speed = p.speed;

    // Move X
    if (dx !== 0) {
      const newX = p.x + dx * speed;
      if (!checkCollision(newX, p.y, p.width, p.height)) {
        p.x = newX;
      }
    }

    // Move Y
    if (dy !== 0) {
      const newY = p.y + dy * speed;
      if (!checkCollision(p.x, newY, p.width, p.height)) {
        p.y = newY;
      }
    }

    // Walking animation
    if (dx !== 0 || dy !== 0) {
      p.animTimer++;
      if (p.animTimer > 8) {
        p.frame = (p.frame + 1) % 4;
        p.animTimer = 0;
      }
    } else {
      p.frame = 0;
    }

    // Camera follow lerp
    const targetCamX = p.x + p.width / 2 - camera.w / 2;
    const targetCamY = p.y + p.height / 2 - camera.h / 2;
    camera.x += (targetCamX - camera.x) * 0.12;
    camera.y += (targetCamY - camera.y) * 0.12;

    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - camera.w));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - camera.h));

    // Dynamic Zone Detection
    detectZone();

    // Check Entity Proximity for interaction prompt
    detectNearbyEntity();
  }

  function detectZone() {
    const p = gameState.player;
    const px = p.x;
    const py = p.y;

    let detectedZone = 'Desa Baris Beranda';
    let detectedSub = 'Area Pemula: Latihan Penempatan 10 Jari';

    if (px < 800 && py < 720) {
      detectedZone = 'Desa Baris Beranda';
      detectedSub = 'Area Pemula: Latihan Penempatan 10 Jari';
    } else if (px >= 800 && px < 1600 && py < 720) {
      detectedZone = 'Hutan Huruf';
      detectedSub = 'Wilayah Monster Kata & Latihan Mengetik Tempur';
    } else if (px >= 1600 && py < 850) {
      detectedZone = 'Pustaka Arsip Kuno';
      detectedSub = 'Wilayah Ekstensi Berkas (.docx, .jpg, .mp3, .py)';
    } else if (px < 1400 && py >= 720) {
      detectedZone = 'Gua Gerbang Shortcut';
      detectedSub = 'Wilayah Ujian Shortcut Windows (Win+E, Ctrl+X/V, F2)';
    } else if (px >= 1400 && px < 1850 && py >= 1250) {
      detectedZone = 'Ruang Rahasia (.secret_vault)';
      detectedSub = 'Direktori Tersembunyi: Pusaka Undo & Emoji';
    } else if (px >= 1850 && py >= 850) {
      detectedZone = 'Sarang Naga Berkas';
      detectedSub = 'Pertempuran Puncak: File Dragon .EXE Corrupted';
    }

    if (detectedZone !== currentZoneName) {
      currentZoneName = detectedZone;
      triggerZoneAnnouncement(detectedZone, detectedSub);
    }
  }

  function detectNearbyEntity() {
    const p = gameState.player;
    const pCenterX = p.x + p.width / 2;
    const pCenterY = p.y + p.height / 2;

    let closest = null;
    let minDistance = 75;

    for (const ent of ENTITIES) {
      const entCenterX = ent.x + ent.w / 2;
      const entCenterY = ent.y + ent.h / 2;
      const dist = Math.hypot(pCenterX - entCenterX, pCenterY - entCenterY);

      if (dist < minDistance) {
        minDistance = dist;
        closest = ent;
      }
    }

    currentInteractingEntity = closest;
    const promptEl = document.getElementById('interaction-prompt');
    const promptTextEl = document.getElementById('prompt-text');

    if (closest && !activeOverlay) {
      promptEl.classList.add('active');
      promptTextEl.textContent = closest.hint || '[ E ] Interaksi';
    } else {
      promptEl.classList.remove('active');
    }
  }

  // ===================================================
  // 8. CANVAS GRAPHICS DRAWING (ALL 6 REGIONS)
  // ===================================================
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // A. Draw World Terrain (6 distinct areas)
    drawWorldTerrain();

    // B. Draw Static Obstacles
    drawObstacles();

    // C. Draw Entities (Campfires, NPCs, Monsters, Boss, Chests)
    drawEntities();

    // D. Draw Player Hero
    drawPlayer();

    // E. Draw Floating Texts
    drawFloatingTexts();

    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  function drawWorldTerrain() {
    // 1. Desa Baris Beranda (North-West)
    ctx.fillStyle = '#172338';
    ctx.fillRect(0, 0, 800, 720);
    // Cobblestone Village Path
    ctx.fillStyle = '#223452';
    ctx.fillRect(280, 200, 140, 520);
    ctx.fillRect(200, 400, 520, 90);

    // 2. Hutan Huruf (Central North)
    ctx.fillStyle = '#0d2218';
    ctx.fillRect(800, 0, 800, 720);
    // Mystic clearing circle
    ctx.fillStyle = '#163826';
    ctx.beginPath();
    ctx.arc(1150, 360, 230, 0, Math.PI * 2);
    ctx.fill();

    // 3. Gua Gerbang Shortcut (South-West)
    ctx.fillStyle = '#19152b';
    ctx.fillRect(0, 720, 1400, 980);
    // Rocky path
    ctx.fillStyle = '#282042';
    ctx.fillRect(380, 720, 160, 700);

    // 4. Pustaka Arsip Kuno (North-East)
    ctx.fillStyle = '#1e1424';
    ctx.fillRect(1600, 0, 1000, 850);
    // Library Marble Rug
    ctx.fillStyle = '#341f3e';
    ctx.fillRect(1680, 120, 540, 600);

    // 5. Ruang Rahasia / Hidden Vault (South Central)
    ctx.fillStyle = '#2d2212';
    ctx.fillRect(1400, 1260, 450, 440);
    // Golden rune carpet
    ctx.fillStyle = '#453518';
    ctx.fillRect(1460, 1320, 320, 320);

    // 6. Sarang Naga Berkas (South-East)
    ctx.fillStyle = '#190a16';
    ctx.fillRect(1850, 850, 750, 850);
    // Corrupt matrix circle
    ctx.fillStyle = '#2e122b';
    ctx.beginPath();
    ctx.arc(2300, 1250, 240, 0, Math.PI * 2);
    ctx.fill();

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const tileSize = 64;
    for (let x = 0; x < WORLD_WIDTH; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < WORLD_HEIGHT; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
  }

  function drawObstacles() {
    for (const obs of OBSTACLES) {
      if (obs.type === 'house') {
        ctx.fillStyle = '#1f2e4d';
        ctx.fillRect(obs.x, obs.y + 30, obs.w, obs.h - 30);
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(obs.x - 10, obs.y + 35);
        ctx.lineTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w + 10, obs.y + 35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0a101f';
        ctx.fillRect(obs.x + obs.w / 2 - 16, obs.y + obs.h - 40, 32, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h + 16);
      } else if (obs.type === 'fence') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        for (let fx = obs.x; fx < obs.x + obs.w; fx += 20) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(fx, obs.y - 6, 6, obs.h + 12);
        }
      } else if (obs.type === 'trees') {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'stone_wall' || obs.type === 'library_wall') {
        ctx.fillStyle = '#262d3d';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#3b475e';
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.type === 'lava_wall' || obs.type === 'corrupt_pillar') {
        ctx.fillStyle = '#450a1a';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.type === 'archive_shelf') {
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(obs.x + 4, obs.y + 6, obs.w - 8, 8);
        ctx.fillRect(obs.x + 4, obs.y + 24, obs.w - 8, 8);
        ctx.fillRect(obs.x + 4, obs.y + 42, obs.w - 8, 8);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      }
    }

    // Explorer Gate
    ctx.fillStyle = gameState.unlockedGates.explorerGate ? '#00e5ff' : '#475569';
    ctx.fillRect(420, 770, 80, 20);
    ctx.font = '11px "Press Start 2P"';
    ctx.fillStyle = gameState.unlockedGates.explorerGate ? '#10b981' : '#f59e0b';
    ctx.textAlign = 'center';
    ctx.fillText(
      gameState.unlockedGates.explorerGate ? 'GATE OPEN' : 'WIN+E GATE',
      460,
      760
    );
  }

  function drawEntities() {
    const time = Date.now() * 0.003;

    for (const ent of ENTITIES) {
      if (ent.type === 'campfire') {
        // Campfire stones
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, ent.y + ent.h / 2 + 4, 18, 0, Math.PI * 2);
        ctx.fill();

        // Fire glow
        const glowRadius = 28 + Math.sin(time * 3) * 4;
        const radGrad = ctx.createRadialGradient(
          ent.x + ent.w / 2, ent.y + ent.h / 2, 4,
          ent.x + ent.w / 2, ent.y + ent.h / 2, glowRadius
        );
        radGrad.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
        radGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
        radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, ent.y + ent.h / 2, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔥', ent.x + ent.w / 2, ent.y + ent.h / 2 + 8);
      } else if (ent.type === 'npc' || ent.type === 'gatekeeper' || ent.type === 'archivist') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(ent.x + ent.w / 2, ent.y + ent.h - 2, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText(ent.avatar, ent.x + ent.w / 2, ent.y + ent.h - 6);

        ctx.font = '10px "Plus Jakarta Sans"';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(ent.name, ent.x + ent.w / 2, ent.y - 12);
      } else if (ent.type === 'monster') {
        if (ent.defeated) continue;

        const floatY = Math.sin(time * 2 + ent.x) * 4;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(ent.x + ent.w / 2, ent.y + ent.h - 2, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText(ent.avatar, ent.x + ent.w / 2, ent.y + ent.h - 6 + floatY);

        ctx.font = '9px "Press Start 2P"';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(ent.name, ent.x + ent.w / 2, ent.y - 14 + floatY);
      } else if (ent.type === 'chest') {
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.fillText(ent.opened ? '📭' : '🎁', ent.x + ent.w / 2, ent.y + ent.h - 4);
      } else if (ent.type === 'secret_portal') {
        // Glowing Golden Door / Rune Stone
        const glow = Math.sin(time * 2) * 5;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, ent.y + ent.h / 2, 30 + glow, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.unlockedGates.secretRoom ? '🚪' : '🔒', ent.x + ent.w / 2, ent.y + ent.h - 8);

        ctx.font = '9px "Press Start 2P"';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('.secret_vault', ent.x + ent.w / 2, ent.y - 12);
      } else if (ent.type === 'boss') {
        if (ent.defeated) {
          ctx.font = '32px serif';
          ctx.textAlign = 'center';
          ctx.fillText('✨💎✨', ent.x + ent.w / 2, ent.y + ent.h - 6);
          ctx.font = '10px "Press Start 2P"';
          ctx.fillStyle = '#10b981';
          ctx.fillText('DRAGON PURGED!', ent.x + ent.w / 2, ent.y - 14);
          continue;
        }

        const floatY = Math.sin(time * 2.5) * 6;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(ent.x + ent.w / 2, ent.y + ent.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '54px serif';
        ctx.textAlign = 'center';
        ctx.fillText(ent.avatar, ent.x + ent.w / 2, ent.y + ent.h + floatY);

        ctx.font = '11px "Press Start 2P"';
        ctx.fillStyle = '#f87171';
        ctx.fillText('FILE DRAGON', ent.x + ent.w / 2, ent.y - 20 + floatY);
      }
    }
  }

  function drawPlayer() {
    const p = gameState.player;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.width / 2, p.y + p.height - 3, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(p.x + 4, p.y + 12, p.width - 8, 16);

    // Glowing Trim
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(p.x + 6, p.y + 16, p.width - 12, 3);

    // Head
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + 8, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    if (p.dir === 'down') {
      ctx.fillRect(p.x + 8, p.y + 7, 3, 3);
      ctx.fillRect(p.x + 17, p.y + 7, 3, 3);
    } else if (p.dir === 'left') {
      ctx.fillRect(p.x + 6, p.y + 7, 3, 3);
    } else if (p.dir === 'right') {
      ctx.fillRect(p.x + 19, p.y + 7, 3, 3);
    }

    // Legs
    ctx.fillStyle = '#1e293b';
    const legOffset = (p.frame % 2 === 0) ? 0 : 3;
    ctx.fillRect(p.x + 6, p.y + 28, 5, 8 + (p.dir === 'left' ? legOffset : -legOffset));
    ctx.fillRect(p.x + 17, p.y + 28, 5, 8 + (p.dir === 'right' ? legOffset : -legOffset));

    // Sword
    ctx.fillStyle = '#94a3b8';
    if (p.dir === 'right' || p.dir === 'down') {
      ctx.fillRect(p.x + p.width, p.y + 14, 4, 14);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(p.x + p.width - 2, p.y + 20, 8, 3);
    } else {
      ctx.fillRect(p.x - 4, p.y + 14, 4, 14);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(p.x - 6, p.y + 20, 8, 3);
    }
  }

  function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.65;
      ft.life--;
      ft.alpha = ft.life / 55;

      ctx.save();
      ctx.font = '11px "Press Start 2P"';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  function gameLoop() {
    updatePlayer();
    render();
  }

  // ===================================================
  // 9. INTERACTION DISPATCHER
  // ===================================================
  function triggerInteraction() {
    if (!currentInteractingEntity) return;
    const ent = currentInteractingEntity;

    if (ent.type === 'campfire') {
      gameState.player.hp = gameState.player.maxHp;
      updateHud();
      saveGameProgress(true);
    } else if (ent.type === 'npc') {
      startDialogue(
        ent.name,
        ent.avatar,
        [
          "Salam petualang muda! Aku adalah Typing Master Alden.",
          "Di dunia Keyboard Force ini, keyboard adalah senjatamu dan jari-jarimu adalah prajuritnya!",
          "Gunakan baris tengah 'Home Row' (ASDF - JKL;). Ada tonjolan khusus di tombol F dan J!",
          "Mari kuuji kemampuan dasar penempatan 10 jarimu."
        ],
        () => {
          startTypingTutorial();
        }
      );
    } else if (ent.type === 'monster') {
      if (ent.defeated) return;
      startCombat(ent);
    } else if (ent.type === 'gatekeeper') {
      startDialogue(
        ent.name,
        ent.avatar,
        [
          "Berhenti! Aku adalah Gatekeeper Cipher.",
          "Di balik gerbang ini terletak Lembah Shortcut, Pustaka Berkas, dan Sarang Naga.",
          "Hanya mereka yang menguasai sihir shortcut sistem Windows yang dapat melintas!"
        ],
        () => {
          startShortcutPuzzle();
        }
      );
    } else if (ent.type === 'archivist') {
      startDialogue(
        ent.name,
        ent.avatar,
        [
          "Ah, syukurlah kamu tiba! Berkas-berkas kerajaan terserak berantakan.",
          "Ekstensi seperti .docx, .jpg, .mp3, .py adalah petunjuk ke mana berkas harus disimpan.",
          "Bantu aku mengelompokkan berkas ke folder yang tepat!"
        ],
        () => {
          startFileSortingPuzzle();
        }
      );
    } else if (ent.type === 'chest') {
      if (ent.opened) {
        showToast('Peti ini sudah kosong.');
        return;
      }
      ent.opened = true;
      sound.playPickup();
      gameState.inventory.push(ent.content);
      addFloatingText(ent.x, ent.y, `+${ent.content.name}`, '#f59e0b');
      showToast(`Mendapatkan item: ${ent.content.name}!`);

      if (ent.content.name.includes('Crystal')) {
        gameState.player.crystals++;
        gainExp(80);
      } else {
        gainExp(40);
      }
      updateHud();
      saveGameProgress(false);
    } else if (ent.type === 'secret_portal') {
      handleSecretRoomInteraction();
    } else if (ent.type === 'boss') {
      if (ent.defeated) {
        showToast('Sang Naga Berkas telah disucikan. Dunia komputer aman!');
        return;
      }
      startBossBattle();
    }
  }

  // ===================================================
  // 10. DIALOGUE SYSTEM
  // ===================================================
  let currentDialogue = {
    speaker: '',
    avatar: '',
    lines: [],
    index: 0,
    onComplete: null
  };

  function startDialogue(speaker, avatar, lines, onComplete = null) {
    activeOverlay = 'dialogue';
    currentDialogue = { speaker, avatar, lines, index: 0, onComplete };

    const diagBox = document.getElementById('dialogue-container');
    const speakerEl = document.getElementById('dialogue-speaker');
    const avatarEl = document.getElementById('dialogue-portrait');
    const textEl = document.getElementById('dialogue-text');

    speakerEl.textContent = speaker;
    avatarEl.textContent = avatar;
    textEl.textContent = lines[0];
    diagBox.classList.add('active');
  }

  function advanceDialogue() {
    currentDialogue.index++;
    const textEl = document.getElementById('dialogue-text');
    if (currentDialogue.index < currentDialogue.lines.length) {
      textEl.textContent = currentDialogue.lines[currentDialogue.index];
      sound.playTone(600, 'sine', 0.08, 0.1);
    } else {
      const diagBox = document.getElementById('dialogue-container');
      diagBox.classList.remove('active');
      activeOverlay = null;
      if (currentDialogue.onComplete) {
        currentDialogue.onComplete();
      }
    }
  }

  // ===================================================
  // 11. TYPING TUTORIAL & FINGER PLACEMENT TRIAL
  // ===================================================
  const tutorialChars = ['F', 'J', 'D', 'K', 'A'];
  let currentTutorialIndex = 0;

  function startTypingTutorial() {
    activeOverlay = 'tutorial';
    currentTutorialIndex = 0;
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.add('active');
    updateTutorialTarget();
  }

  function updateTutorialTarget() {
    const char = tutorialChars[currentTutorialIndex];
    const targetCharEl = document.getElementById('tutorial-target-char');
    const feedbackEl = document.getElementById('tutorial-feedback');
    const info = FINGER_MAP[char] || { finger: 'Unknown', row: 'Unknown', tip: '' };

    targetCharEl.textContent = char;
    feedbackEl.className = 'typing-feedback-message';
    feedbackEl.textContent = `Target: Ketik huruf '${char}'. Gunakan: ${info.finger} (${info.row})`;

    document.querySelectorAll('.kb-key').forEach(k => k.classList.remove('highlight-target'));
    const targetKeyEl = document.querySelector(`.kb-key[data-key="${char.toUpperCase()}"]`);
    if (targetKeyEl) {
      targetKeyEl.classList.add('highlight-target');
    }
  }

  function handleTutorialKeypress(e) {
    const targetChar = tutorialChars[currentTutorialIndex];
    const typedChar = e.key.toUpperCase();
    const feedbackEl = document.getElementById('tutorial-feedback');
    const info = FINGER_MAP[targetChar];

    if (typedChar === targetChar) {
      sound.playSuccess();
      feedbackEl.className = 'typing-feedback-message success';
      feedbackEl.textContent = `Tepat sekali! ${info.tip}`;
      addFloatingText(gameState.player.x, gameState.player.y, `Benar: ${targetChar}`, '#10b981');

      currentTutorialIndex++;
      const q1 = gameState.quests.find(q => q.id === 'q1');
      if (q1) {
        q1.progress = Math.min(q1.total, currentTutorialIndex);
      }

      if (currentTutorialIndex >= tutorialChars.length) {
        if (q1 && !q1.completed) {
          q1.completed = true;
          gameState.player.crystals++;
          gainExp(60);
          showToast('🏆 Quest Selesai: Master the Home Row!');
        }
        setTimeout(() => {
          closeCurrentOverlay();
          showToast('Pelajaran Dasar Selesai! Kamu siap menjelajahi Hutan Huruf!');
        }, 1200);
      } else {
        setTimeout(updateTutorialTarget, 600);
      }
    } else {
      sound.playError();
      feedbackEl.className = 'typing-feedback-message error';
      feedbackEl.textContent = `Kurang tepat. Kamu menekan '${typedChar}'. Ingat, ${info.finger} untuk huruf '${targetChar}'.`;
    }
  }

  // ===================================================
  // 12. COMBAT SYSTEM (Forest Monsters)
  // ===================================================
  let activeMonster = null;
  let combatWordList = [];
  let currentCombatWordIndex = 0;
  let currentTypedWord = '';

  function startCombat(monster) {
    activeOverlay = 'combat';
    activeMonster = monster;
    combatWordList = [...monster.words];
    currentCombatWordIndex = 0;
    currentTypedWord = '';

    const overlay = document.getElementById('combat-overlay');
    const monsterNameEl = document.getElementById('combat-monster-name');
    const monsterAvatarEl = document.getElementById('combat-monster-sprite');

    monsterNameEl.textContent = monster.name;
    monsterAvatarEl.textContent = monster.avatar;
    overlay.classList.add('active');

    updateCombatDisplay();
  }

  function updateCombatDisplay() {
    const targetWord = combatWordList[currentCombatWordIndex];
    const wordDisplayEl = document.getElementById('combat-word-display');
    const hpFillEl = document.getElementById('combat-monster-hp-fill');

    if (!targetWord) return;

    const typedPart = targetWord.slice(0, currentTypedWord.length);
    const remainingPart = targetWord.slice(currentTypedWord.length);

    wordDisplayEl.innerHTML = `
      <span class="combat-char-typed">${typedPart}</span><span class="combat-char-remaining">${remainingPart}</span>
    `;

    const hpPercent = (1 - (currentCombatWordIndex / combatWordList.length)) * 100;
    hpFillEl.style.width = `${Math.max(0, hpPercent)}%`;
  }

  function handleCombatKeypress(e) {
    if (!activeMonster) return;
    const targetWord = combatWordList[currentCombatWordIndex];
    const expectedChar = targetWord[currentTypedWord.length];

    if (e.key.toUpperCase() === expectedChar) {
      currentTypedWord += expectedChar;
      sound.playAttack();

      if (currentTypedWord === targetWord) {
        sound.playSuccess();
        addFloatingText(activeMonster.x, activeMonster.y, 'SLASH! -35 HP', '#ef4444');
        currentCombatWordIndex++;
        currentTypedWord = '';

        if (currentCombatWordIndex >= combatWordList.length) {
          activeMonster.defeated = true;
          sound.playLevelUp();
          gainExp(50);
          gameState.inventory.push({ id: 'data_shard', name: 'Data Shard', icon: '💾', desc: 'Serpihan data murni dari bug.' });

          const q2 = gameState.quests.find(q => q.id === 'q2');
          if (q2) {
            q2.progress = Math.min(q2.total, q2.progress + 1);
            if (q2.progress >= q2.total && !q2.completed) {
              q2.completed = true;
              gameState.player.crystals++;
              gainExp(100);
              showToast('🏆 Quest Selesai: Cleansing the Letter Forest!');
            }
          }

          showToast(`${activeMonster.name} berhasil dilumpuhkan!`);
          setTimeout(() => {
            closeCurrentOverlay();
          }, 800);
          return;
        }
      }
      updateCombatDisplay();
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      sound.playError();
      gameState.player.hp = Math.max(10, gameState.player.hp - 5);
      updateHud();
      addFloatingText(gameState.player.x, gameState.player.y, '-5 HP', '#ef4444');
    }
  }

  // ===================================================
  // 13. SHORTCUT GATE PUZZLE
  // ===================================================
  let currentShortcutIndex = 0;

  function startShortcutPuzzle() {
    activeOverlay = 'shortcut';
    currentShortcutIndex = 0;
    const overlay = document.getElementById('shortcut-overlay');
    overlay.classList.add('active');
    renderShortcutChallenge();
  }

  function renderShortcutChallenge() {
    const challenge = SHORTCUT_CHALLENGES[currentShortcutIndex];
    const titleEl = document.getElementById('shortcut-quest-title');
    const descEl = document.getElementById('shortcut-quest-desc');
    const optionsGrid = document.getElementById('shortcut-options');

    titleEl.textContent = challenge.title;
    descEl.textContent = challenge.lore;
    optionsGrid.innerHTML = '';

    challenge.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-shortcut-option';
      btn.innerHTML = `<span>⚡</span> <span>${opt.text}</span>`;
      btn.onclick = () => {
        if (opt.isCorrect) {
          sound.playSuccess();
          showToast(`Benar! ${opt.explanation}`);
          currentShortcutIndex++;

          if (currentShortcutIndex >= SHORTCUT_CHALLENGES.length) {
            gameState.unlockedGates.explorerGate = true;
            const q3 = gameState.quests.find(q => q.id === 'q3');
            if (q3 && !q3.completed) {
              q3.completed = true;
              q3.progress = 1;
              gameState.player.crystals++;
              gainExp(80);
              showToast('🏆 Gerbang Explorer Terbuka! Akses Lembah Diizinkan!');
            }
            setTimeout(closeCurrentOverlay, 1400);
          } else {
            renderShortcutChallenge();
          }
        } else {
          sound.playError();
          showToast(opt.explanation);
        }
      };
      optionsGrid.appendChild(btn);
    });
  }

  // ===================================================
  // 14. FILE EXTENSION SORTING PUZZLE
  // ===================================================
  let currentFileIndex = 0;

  function startFileSortingPuzzle() {
    activeOverlay = 'file_puzzle';
    currentFileIndex = 0;
    const overlay = document.getElementById('file-puzzle-overlay');
    overlay.classList.add('active');
    renderFilePuzzleItem();
  }

  function renderFilePuzzleItem() {
    const file = ARCHIVE_FILES[currentFileIndex];
    const fileNameEl = document.getElementById('puzzle-file-name');
    const fileIconEl = document.getElementById('puzzle-file-icon');
    const fileHintEl = document.getElementById('puzzle-file-hint');
    const foldersGrid = document.getElementById('puzzle-folders-grid');

    fileNameEl.textContent = file.name;
    fileIconEl.textContent = file.icon;
    fileHintEl.textContent = `Petunjuk: ${file.hint} (Ekstensi: ${file.ext})`;

    const folders = [
      { name: 'Documents', icon: '📁' },
      { name: 'Pictures', icon: '🖼️' },
      { name: 'Music', icon: '🎵' },
      { name: 'Videos', icon: '🎬' },
      { name: 'Projects', icon: '💻' }
    ];

    foldersGrid.innerHTML = '';
    folders.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'btn-folder-target';
      btn.innerHTML = `
        <div class="folder-icon">${f.icon}</div>
        <div class="folder-title">${f.name}</div>
      `;
      btn.onclick = () => {
        if (f.name === file.targetFolder) {
          sound.playSuccess();
          showToast(`Tepat! ${file.name} dipindahkan ke folder ${f.name}.`);
          currentFileIndex++;

          const q4 = gameState.quests.find(q => q.id === 'q4');
          if (q4) {
            q4.progress = Math.min(q4.total, currentFileIndex);
          }

          if (currentFileIndex >= 6) {
            if (q4 && !q4.completed) {
              q4.completed = true;
              gameState.player.crystals++;
              gainExp(120);
              showToast('🏆 Master of Files! Arsip Kerajaan Selesai Dikelola!');
            }
            setTimeout(closeCurrentOverlay, 1200);
          } else {
            renderFilePuzzleItem();
          }
        } else {
          sound.playError();
          showToast(`Kurang tepat. Ekstensi ${file.ext} bukan untuk folder ${f.name}!`);
        }
      };
      foldersGrid.appendChild(btn);
    });
  }

  // ===================================================
  // 15. SECRET ROOM / HIDDEN VAULT LOGIC
  // ===================================================
  function handleSecretRoomInteraction() {
    const hasFolderKey = gameState.inventory.some(i => i.id === 'folder_key');

    if (!gameState.unlockedGates.secretRoom && !hasFolderKey) {
      startDialogue(
        'Prasasti Segel Tersembunyi',
        '🔒',
        [
          "Pintu ini terkunci oleh mantra direktori tersembunyi (.secret_vault).",
          "Untuk membukanya, kamu membutuhkan KUNCI FOLDER dari peti di desa tua!",
          "Petunjuk: Di komputer, shortcut membuat folder baru adalah 'Ctrl + Shift + N'."
        ]
      );
      return;
    }

    // Unlocked or player has key!
    gameState.unlockedGates.secretRoom = true;
    sound.playSecretUnlock();

    const q5 = gameState.quests.find(q => q.id === 'q5');
    if (q5 && !q5.completed) {
      q5.progress = 1;
      q5.completed = true;
      gainExp(100);
      showToast('⭐ Rahasia Terungkap: Folder Rahasia Terbuka!');
    }

    activeOverlay = 'secret_room';
    const overlay = document.getElementById('secret-room-overlay');
    overlay.classList.add('active');

    const claimBtn = document.getElementById('btn-claim-secret-reward');
    claimBtn.onclick = () => {
      sound.playPickup();
      gameState.inventory.push({
        id: 'golden_keycap',
        name: 'Rune Undo (Golden Keycap)',
        icon: '⌨️',
        desc: 'Mantra magis Ctrl+Z: Membalikkan kesalahan sistem.'
      });
      gainExp(100);
      closeCurrentOverlay();
      showToast('Mendapatkan Pusaka: Rune Undo (Golden Keycap)!');
    };
  }

  // ===================================================
  // 16. FINAL BOSS: FILE DRAGON MECHANICS
  // ===================================================
  let bossFight = {
    phase: 1,
    hp: 1000,
    maxHp: 1000,
    words: ['FIREWALL', 'ANTIVIRUS', 'ENCRYPTION', 'SECURITY', 'RESTORE'],
    wordIndex: 0,
    currentTyped: '',
    shortcuts: [
      {
        q: 'Dragon menyebabkan Freeze/Hang! Shortcut instan membuka Task Manager?',
        opts: [
          { t: 'Ctrl + Shift + Esc', correct: true, exp: 'Tepat! Membuka Task Manager instan tanpa menu perantara!' },
          { t: 'Alt + Tab', correct: false, exp: 'Itu adalah Switch Window/Aplikasi.' },
          { t: 'Ctrl + P', correct: false, exp: 'Itu adalah Print Dokumen.' },
          { t: 'Win + L', correct: false, exp: 'Itu mengunci layar komputer.' }
        ]
      },
      {
        q: 'Dragon menyerang dengan gelombang jendela bertumpuk! Minimalkan semua jendela ke Desktop?',
        opts: [
          { t: 'Win + D', correct: true, exp: 'Sempurna! Win + D menampilkan Desktop seketika!' },
          { t: 'Ctrl + W', correct: false, exp: 'Itu menutup tab saat ini.' },
          { t: 'F5', correct: false, exp: 'Itu memuat ulang (Refresh).' },
          { t: 'Alt + F4', correct: false, exp: 'Itu menutup jendela program.' }
        ]
      },
      {
        q: 'Dragon merusak susunan teks mantra! Gunakan mantra pembatal aksi terakhir (Undo)!',
        opts: [
          { t: 'Ctrl + Z', correct: true, exp: 'Sempurna! Ctrl + Z adalah Undo sakti pembatal aksi salah!' },
          { t: 'Ctrl + Y', correct: false, exp: 'Itu adalah Redo.' },
          { t: 'Ctrl + S', correct: false, exp: 'Itu adalah Simpan (Save).' },
          { t: 'Delete', correct: false, exp: 'Itu justru menghapus berkas!' }
        ]
      }
    ],
    shortcutIndex: 0,
    finalPhrase: 'RESTORE CRYSTAL OF KNOWLEDGE',
    finalTyped: ''
  };

  function startBossBattle() {
    activeOverlay = 'boss';
    bossFight.phase = 1;
    bossFight.hp = 1000;
    bossFight.wordIndex = 0;
    bossFight.currentTyped = '';
    bossFight.shortcutIndex = 0;
    bossFight.finalTyped = '';

    sound.playDragonRoar();

    const overlay = document.getElementById('boss-overlay');
    overlay.classList.add('active');

    renderBossArena();
  }

  function renderBossArena() {
    const phaseBadge = document.getElementById('boss-phase-badge');
    const hpFill = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    const promptText = document.getElementById('boss-prompt-text');
    const wordDisplay = document.getElementById('boss-word-display');
    const dialogueLine = document.getElementById('boss-dialogue');
    const shortcutContainer = document.getElementById('boss-shortcut-container');

    const hpPct = Math.max(0, (bossFight.hp / bossFight.maxHp) * 100);
    hpFill.style.width = `${hpPct}%`;
    hpText.textContent = `${bossFight.hp} / ${bossFight.maxHp} HP`;

    if (bossFight.phase === 1) {
      phaseBadge.textContent = 'PHASE 1 / 3: DATA CORRUPTION';
      dialogueLine.textContent = '"ROAAAR! File sistemmu akan terhapus oleh nafas korupsiku!"';
      promptText.textContent = 'KETIK MANTRA PERLINDUNGAN SISTEM DENGAN CEPAT:';
      shortcutContainer.style.display = 'none';
      wordDisplay.style.display = 'block';

      const targetWord = bossFight.words[bossFight.wordIndex];
      const typed = targetWord.slice(0, bossFight.currentTyped.length);
      const rem = targetWord.slice(bossFight.currentTyped.length);

      wordDisplay.innerHTML = `
        <span class="combat-char-typed">${typed}</span><span class="combat-char-remaining">${rem}</span>
      `;
    } else if (bossFight.phase === 2) {
      phaseBadge.textContent = 'PHASE 2 / 3: GLITCH STORM';
      dialogueLine.textContent = '"Layar komputermu macet! Bisakah kamu mengatasi crash sistem ini?!"';
      promptText.textContent = 'PILIH SHORTCUT COUNTER-SPELL YANG TEPAT:';
      wordDisplay.style.display = 'none';
      shortcutContainer.style.display = 'block';

      const currentQ = bossFight.shortcuts[bossFight.shortcutIndex];
      promptText.textContent = currentQ.q;
      const optionsGrid = document.getElementById('boss-shortcut-options');
      optionsGrid.innerHTML = '';

      currentQ.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-shortcut-option';
        btn.innerHTML = `<span>⚡</span> <span>${opt.t}</span>`;
        btn.onclick = () => {
          if (opt.correct) {
            sound.playSuccess();
            sound.playBossHit();
            bossFight.hp -= 120;
            showToast(`Benar! ${opt.exp}`);
            addFloatingText(gameState.player.x, gameState.player.y, 'CRITICAL HIT! -120 HP', '#ef4444');
            bossFight.shortcutIndex++;

            if (bossFight.shortcutIndex >= bossFight.shortcuts.length) {
              bossFight.phase = 3;
              renderBossArena();
            } else {
              renderBossArena();
            }
          } else {
            sound.playError();
            gameState.player.hp = Math.max(10, gameState.player.hp - 10);
            updateHud();
            showToast(opt.exp);
          }
        };
        optionsGrid.appendChild(btn);
      });
    } else if (bossFight.phase === 3) {
      phaseBadge.textContent = 'PHASE 3 / 3: THE FINAL PURGE';
      dialogueLine.textContent = '"TIDAAK! Struktur korupsiku runtuh...!!!"';
      promptText.textContent = 'KETIK MANTRA PEMULIHAN KRISTAL TERAKHIR:';
      shortcutContainer.style.display = 'none';
      wordDisplay.style.display = 'block';

      const target = bossFight.finalPhrase;
      const typed = target.slice(0, bossFight.finalTyped.length);
      const rem = target.slice(bossFight.finalTyped.length);

      wordDisplay.innerHTML = `
        <span class="combat-char-typed">${typed}</span><span class="combat-char-remaining">${rem}</span>
      `;
    }
  }

  function handleBossKeypress(e) {
    if (bossFight.phase === 1) {
      const targetWord = bossFight.words[bossFight.wordIndex];
      const expected = targetWord[bossFight.currentTyped.length];

      if (e.key.toUpperCase() === expected) {
        bossFight.currentTyped += expected;
        sound.playAttack();

        if (bossFight.currentTyped === targetWord) {
          sound.playSuccess();
          sound.playBossHit();
          bossFight.hp -= 100;
          addFloatingText(gameState.player.x, gameState.player.y, 'STRIKE! -100 HP', '#ef4444');
          bossFight.wordIndex++;
          bossFight.currentTyped = '';

          if (bossFight.wordIndex >= bossFight.words.length) {
            bossFight.phase = 2;
          }
        }
        renderBossArena();
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        sound.playError();
        gameState.player.hp = Math.max(10, gameState.player.hp - 3);
        updateHud();
      }
    } else if (bossFight.phase === 3) {
      const target = bossFight.finalPhrase;
      const expected = target[bossFight.finalTyped.length];

      if (e.key.toUpperCase() === expected || (expected === ' ' && e.key === ' ')) {
        bossFight.finalTyped += expected;
        sound.playAttack();

        if (bossFight.finalTyped === target) {
          // Boss Defeated!
          bossFight.hp = 0;
          renderBossArena();
          triggerBossVictory();
          return;
        }
        renderBossArena();
      } else if (e.key.length === 1) {
        sound.playError();
      }
    }
  }

  function triggerBossVictory() {
    sound.playVictory();
    const bossEnt = ENTITIES.find(e => e.type === 'boss');
    if (bossEnt) bossEnt.defeated = true;
    gameState.defeatedBoss = true;

    // Complete Quest 6
    const q6 = gameState.quests.find(q => q.id === 'q6');
    if (q6) {
      q6.progress = 1;
      q6.completed = true;
    }

    gameState.player.crystals = 5;
    gainExp(250);
    saveGameProgress(false);

    setTimeout(() => {
      closeCurrentOverlay();
      openVictoryModal();
    }, 1200);
  }

  function openVictoryModal() {
    activeOverlay = 'victory';
    const overlay = document.getElementById('victory-overlay');
    document.getElementById('v-stat-level').textContent = `LV ${gameState.player.level}`;
    document.getElementById('v-stat-crystals').textContent = `${gameState.player.crystals} / 5`;
    document.getElementById('v-stat-title').textContent = 'GRAND MASTER';

    overlay.classList.add('active');

    document.getElementById('btn-victory-continue').onclick = () => {
      closeCurrentOverlay();
      showToast('Selamat! Silakan terus menjelajahi seluruh sudut dunia Keyboard Force!');
    };

    document.getElementById('btn-victory-replay').onclick = () => {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    };
  }

  // ===================================================
  // 17. INVENTORY & QUEST MODALS
  // ===================================================
  function openInventoryModal() {
    activeOverlay = 'inventory';
    const overlay = document.getElementById('inventory-overlay');
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    gameState.inventory.forEach(item => {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.innerHTML = `
        <div class="inv-icon">${item.icon}</div>
        <div class="inv-label">${item.name}</div>
      `;
      slot.onclick = () => {
        showToast(`${item.name}: ${item.desc}`);
      };
      grid.appendChild(slot);
    });

    overlay.classList.add('active');
  }

  function openQuestModal() {
    activeOverlay = 'quests';
    const overlay = document.getElementById('quest-overlay');
    const list = document.getElementById('quest-list');
    list.innerHTML = '';

    gameState.quests.forEach(q => {
      const card = document.createElement('div');
      card.className = 'quest-item-card';
      const pct = Math.round((q.progress / q.total) * 100);

      card.innerHTML = `
        <div class="quest-header-row">
          <div class="quest-title">${q.title}</div>
          <div class="quest-status-badge ${q.completed ? 'status-completed' : 'status-active'}">
            ${q.completed ? 'COMPLETED' : `${q.progress} / ${q.total}`}
          </div>
        </div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-progress-bar">
          <div class="quest-progress-fill" style="width: ${pct}%"></div>
        </div>
      `;
      list.appendChild(card);
    });

    overlay.classList.add('active');
  }

  function closeCurrentOverlay() {
    const overlays = document.querySelectorAll('.overlay-panel');
    overlays.forEach(o => o.classList.remove('active'));
    activeOverlay = null;
  }

  // ===================================================
  // 18. PROGRESSION & HUD UPDATES
  // ===================================================
  function gainExp(amount) {
    gameState.player.exp += amount;
    addFloatingText(gameState.player.x, gameState.player.y, `+${amount} EXP`, '#00e5ff');

    if (gameState.player.exp >= gameState.player.maxExp) {
      gameState.player.exp -= gameState.player.maxExp;
      gameState.player.level++;
      gameState.player.maxExp = Math.round(gameState.player.maxExp * 1.5);
      gameState.player.maxHp += 20;
      gameState.player.hp = gameState.player.maxHp;
      sound.playLevelUp();
      showToast(`⭐ LEVEL UP! Sekarang kamu Level ${gameState.player.level}!`);
    }
    updateHud();
    saveGameProgress(false);
  }

  function updateHud() {
    const p = gameState.player;
    document.getElementById('hud-player-level').textContent = `LV ${p.level}`;
    document.getElementById('hud-player-hp-num').textContent = `${p.hp}/${p.maxHp}`;
    document.getElementById('hud-player-exp-num').textContent = `${p.exp}/${p.maxExp}`;
    document.getElementById('hud-crystal-count').textContent = p.crystals;

    const hpPercent = (p.hp / p.maxHp) * 100;
    const expPercent = (p.exp / p.maxExp) * 100;
    document.getElementById('hud-hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('hud-exp-bar').style.width = `${expPercent}%`;

    const activeQuest = gameState.quests.find(q => !q.completed);
    const pill = document.getElementById('active-quest-pill');
    if (activeQuest) {
      pill.innerHTML = `<span>📜 Misi:</span> <b>${activeQuest.title}</b> (${activeQuest.progress}/${activeQuest.total})`;
    } else {
      pill.innerHTML = `<span>🏆 Semua Misi Selesai! Crystal of Knowledge Terpulihkan!</span>`;
    }
  }

  // ===================================================
  // 19. INITIALIZATION & MENU BINDINGS
  // ===================================================
  function initGame() {
    resizeCanvas();
    setupVirtualControls();
    updateHud();

    const btnNew = document.getElementById('btn-start-adventure');
    const btnContinue = document.getElementById('btn-continue-adventure');
    const btnSound = document.getElementById('btn-toggle-sound');
    const btnInv = document.getElementById('btn-hud-inventory');
    const btnQuest = document.getElementById('btn-hud-quests');

    if (btnNew) {
      btnNew.onclick = () => {
        sound.init();
        sound.playSuccess();
        document.getElementById('start-screen').style.display = 'none';
        showToast('Jelajahi dunia! Gunakan WASD / Arrow Keys untuk bergerak.');
      };
    }

    if (btnContinue) {
      const hasSave = localStorage.getItem(SAVE_KEY);
      if (hasSave) {
        btnContinue.style.display = 'block';
        btnContinue.onclick = () => {
          sound.init();
          sound.playSuccess();
          loadGameSave();
          updateHud();
          document.getElementById('start-screen').style.display = 'none';
          showToast('Progress petualangan berhasil dimuat!');
        };
      } else {
        btnContinue.style.display = 'none';
      }
    }

    if (btnSound) {
      btnSound.onclick = () => {
        const active = sound.toggle();
        btnSound.textContent = active ? '🔊' : '🔇';
        showToast(active ? 'Suara Aktif' : 'Suara Dimatikan');
      };
    }

    if (btnInv) btnInv.onclick = openInventoryModal;
    if (btnQuest) btnQuest.onclick = openQuestModal;

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.onclick = closeCurrentOverlay;
    });

    requestAnimationFrame(gameLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
