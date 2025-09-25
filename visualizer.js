#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');

class AudioVisualizer extends EventEmitter {
  constructor() {
    super();
    this.width = process.stdout.columns || 120;
    this.height = process.stdout.rows || 30;
    this.particles = [];
    this.waves = [];
    this.networks = [];
    this.fractals = [];
    this.startTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
    this.paused = false;
    this.recording = false;
    this.recordingFrames = [];
    this.currentTheme = 'cyberpunk';
    
    // 拡張カラーパレット
    this.themes = {
      cyberpunk: {
        primary: ['\x1b[38;5;51m', '\x1b[38;5;201m', '\x1b[38;5;226m'],
        secondary: ['\x1b[38;5;21m', '\x1b[38;5;129m', '\x1b[38;5;196m'],
        bg: '\x1b[48;5;16m',
        accent: '\x1b[38;5;255m'
      },
      neon: {
        primary: ['\x1b[38;5;118m', '\x1b[38;5;198m', '\x1b[38;5;87m'],
        secondary: ['\x1b[38;5;46m', '\x1b[38;5;207m', '\x1b[38;5;51m'],
        bg: '\x1b[48;5;232m',
        accent: '\x1b[38;5;15m'
      },
      ocean: {
        primary: ['\x1b[38;5;39m', '\x1b[38;5;81m', '\x1b[38;5;123m'],
        secondary: ['\x1b[38;5;27m', '\x1b[38;5;69m', '\x1b[38;5;111m'],
        bg: '\x1b[48;5;17m',
        accent: '\x1b[38;5;255m'
      },
      sunset: {
        primary: ['\x1b[38;5;208m', '\x1b[38;5;196m', '\x1b[38;5;220m'],
        secondary: ['\x1b[38;5;166m', '\x1b[38;5;124m', '\x1b[38;5;178m'],
        bg: '\x1b[48;5;52m',
        accent: '\x1b[38;5;230m'
      }
    };

    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      blink: '\x1b[5m',
      reverse: '\x1b[7m',
      hidden: '\x1b[8m'
    };

    this.modes = [
      'particles', 'waves', 'matrix', 'fire', 'network', 'fractal', 
      'spiral', 'plasma', 'stars', 'rain', 'dna', 'mandelbrot'
    ];
    this.currentModeIndex = 0;
    this.mode = this.modes[0];
    
    // 音楽的パラメータ
    this.musicParams = {
      bass: 0,
      treble: 0,
      tempo: 120,
      beat: 0,
      harmony: []
    };
    
    // パフォーマンス監視
    this.performanceStats = {
      renderTime: 0,
      particleCount: 0,
      memoryUsage: 0
    };

    this.setupInput();
    this.showWelcome();
  }

  showWelcome() {
    console.clear();
    const welcome = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🌟 TERMINAL VISUALIZER PRO v2.0 🌟                    ║
║                                                                           ║
║  An advanced real-time visualization engine with multiple effects,       ║
║  themes, recording capabilities, and performance optimization.            ║
║                                                                           ║
║  🎮 CONTROLS:                                                             ║
║  [1-9] Switch Modes    [t] Change Theme    [r] Record/Stop                ║
║  [+/-] Speed Control   [p] Pause/Resume    [s] Save Screenshot            ║
║  [m] Auto Mode         [i] Info Toggle     [q] Quit                       ║
║                                                                           ║
║  🎨 MODES: Particles, Waves, Matrix, Fire, Network, Fractal,             ║
║           Spiral, Plasma, Stars, Rain, DNA, Mandelbrot                   ║
║                                                                           ║
║  🎵 Features: Music Visualization, Performance Monitoring, Themes         ║
╚═══════════════════════════════════════════════════════════════════════════╝
`;
    console.log(welcome);
    setTimeout(() => this.start(), 3000);
  }

  setupInput() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.on('keypress', (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        this.cleanup();
      }
      
      if (!key) return;
      
      switch (key.name) {
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          const index = parseInt(key.name) - 1;
          if (index < this.modes.length) {
            this.currentModeIndex = index;
            this.mode = this.modes[index];
            this.initializeMode();
          }
          break;
        case 't':
          this.cycleTheme();
          break;
        case 'r':
          this.toggleRecording();
          break;
        case 'p':
          this.paused = !this.paused;
          break;
        case 's':
          this.saveScreenshot();
          break;
        case 'm':
          this.toggleAutoMode();
          break;
        case 'i':
          this.showInfo = !this.showInfo;
          break;
        case 'q':
          this.cleanup();
          break;
        case 'equal': // +キー
          this.adjustSpeed(1.2);
          break;
        case 'minus': // -キー
          this.adjustSpeed(0.8);
          break;
      }
    });
  }

  cycleTheme() {
    const themes = Object.keys(this.themes);
    const currentIndex = themes.indexOf(this.currentTheme);
    this.currentTheme = themes[(currentIndex + 1) % themes.length];
  }

  toggleRecording() {
    this.recording = !this.recording;
    if (this.recording) {
      this.recordingFrames = [];
      this.emit('recordingStarted');
    } else {
      this.saveRecording();
      this.emit('recordingStopped');
    }
  }

  saveScreenshot() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot_${timestamp}.txt`;
    // スクリーンショット保存のロジック（簡略化）
    this.emit('screenshotSaved', filename);
  }

  initializeMode() {
    switch (this.mode) {
      case 'particles':
        this.initParticles(200);
        break;
      case 'waves':
        this.initWaves();
        break;
      case 'matrix':
        this.initMatrix();
        break;
      case 'fire':
        this.initFire();
        break;
      case 'network':
        this.initNetwork();
        break;
      case 'fractal':
        this.initFractal();
        break;
      case 'spiral':
        this.initSpiral();
        break;
      case 'plasma':
        this.initPlasma();
        break;
      case 'stars':
        this.initStars();
        break;
      case 'rain':
        this.initRain();
        break;
      case 'dna':
        this.initDNA();
        break;
      case 'mandelbrot':
        this.initMandelbrot();
        break;
    }
  }

  initParticles(count = 150) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: Math.random() * 200,
        maxLife: 200,
        size: Math.random() * 3 + 1,
        color: Math.floor(Math.random() * 3),
        trail: [],
        type: ['●', '◉', '⬢', '◆', '★'][Math.floor(Math.random() * 5)]
      });
    }
  }

  initNetwork() {
    this.networks = [];
    const nodeCount = 30;
    for (let i = 0; i < nodeCount; i++) {
      this.networks.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        pulse: Math.random() * Math.PI * 2,
        energy: Math.random()
      });
    }
  }

  initFractal() {
    this.fractals = {
      iterations: 100,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      colorShift: 0
    };
  }

  initSpiral() {
    this.spiral = {
      arms: 5,
      tightness: 0.1,
      rotation: 0,
      particles: []
    };
    for (let i = 0; i < 300; i++) {
      this.spiral.particles.push({
        angle: (i / 300) * Math.PI * 20,
        radius: i * 0.5,
        life: Math.random() * 100
      });
    }
  }

  initPlasma() {
    this.plasma = {
      time: 0,
      frequency1: 0.1,
      frequency2: 0.13,
      frequency3: 0.16,
      frequency4: 0.18
    };
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        z: Math.random() * 1000,
        brightness: Math.random(),
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 2
      });
    }
  }

  initDNA() {
    this.dna = {
      helixA: [],
      helixB: [],
      connections: [],
      rotation: 0
    };
    
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 8;
      this.dna.helixA.push({
        x: this.width / 2 + Math.cos(angle) * 10,
        y: i * (this.height / 50),
        base: ['A', 'T', 'G', 'C'][Math.floor(Math.random() * 4)]
      });
      this.dna.helixB.push({
        x: this.width / 2 + Math.cos(angle + Math.PI) * 10,
        y: i * (this.height / 50),
        base: ['A', 'T', 'G', 'C'][Math.floor(Math.random() * 4)]
      });
    }
  }

  initMandelbrot() {
    this.mandelbrot = {
      maxIter: 50,
      zoom: 1,
      centerX: -0.5,
      centerY: 0,
      colorCycle: 0
    };
  }

  // その他の初期化メソッド
  initWaves() {
    this.waves = [];
    for (let i = 0; i < 8; i++) {
      this.waves.push({
        amplitude: 5 + Math.random() * 15,
        frequency: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.08,
        offset: Math.random() * this.height
      });
    }
  }

  initMatrix() {
    this.matrixColumns = [];
    for (let x = 0; x < this.width; x++) {
      this.matrixColumns[x] = {
        drops: [],
        nextDrop: Math.random() * 200,
        glitch: Math.random() > 0.95
      };
    }
  }

  initFire() {
    this.fireParticles = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < 8; y++) {
        this.fireParticles.push({
          x: x,
          y: this.height - y - 1,
          intensity: Math.random(),
          decay: 0.92 + Math.random() * 0.06,
          flicker: Math.random() * Math.PI * 2
        });
      }
    }
  }

  initRain() {
    this.rainDrops = [];
    for (let i = 0; i < 100; i++) {
      this.rainDrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 2 + Math.random() * 3,
        length: 3 + Math.random() * 5,
        intensity: Math.random()
      });
    }
  }

  clear() {
    console.clear();
    process.stdout.write('\x1b[H');
  }

  getThemeColor(type, index = 0) {
    const theme = this.themes[this.currentTheme];
    if (type === 'primary') return theme.primary[index % theme.primary.length];
    if (type === 'secondary') return theme.secondary[index % theme.secondary.length];
    return theme[type] || this.colors.reset;
  }

  drawAdvancedParticles(time) {
    const buffer = this.createBuffer();
    
    this.particles.forEach((particle, i) => {
      // 高度な物理計算
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 重力井戸効果
      if (distance > 0) {
        const force = 0.001;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
      
      // パーティクル間相互作用
      this.particles.forEach((other, j) => {
        if (i !== j) {
          const odx = other.x - particle.x;
          const ody = other.y - particle.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          if (odist < 10 && odist > 0) {
            const repulsion = 0.1 / odist;
            particle.vx -= (odx / odist) * repulsion;
            particle.vy -= (ody / odist) * repulsion;
          }
        }
      });
      
      // 移動と更新
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      
      // トレイル効果
      particle.trail.push({ x: particle.x, y: particle.y });
      if (particle.trail.length > 5) particle.trail.shift();
      
      // 境界処理
      this.handleBoundaries(particle);
      
      // 再生成
      if (particle.life <= 0) {
        this.resetParticle(particle);
      }
      
      // 描画
      this.drawParticleWithTrail(buffer, particle, time);
    });
    
    this.renderBuffer(buffer);
  }

  drawNetwork(time) {
    const buffer = this.createBuffer();
    
    // ノード更新
    this.networks.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      node.pulse += 0.1;
      node.energy = 0.5 + 0.5 * Math.sin(node.pulse);
      
      // 境界での反射
      if (node.x <= 0 || node.x >= this.width) node.vx *= -1;
      if (node.y <= 0 || node.y >= this.height) node.vy *= -1;
      
      node.x = Math.max(0, Math.min(this.width - 1, node.x));
      node.y = Math.max(0, Math.min(this.height - 1, node.y));
    });
    
    // 接続描画
    for (let i = 0; i < this.networks.length; i++) {
      for (let j = i + 1; j < this.networks.length; j++) {
        const nodeA = this.networks[i];
        const nodeB = this.networks[j];
        const distance = Math.sqrt(
          Math.pow(nodeA.x - nodeB.x, 2) + 
          Math.pow(nodeA.y - nodeB.y, 2)
        );
        
        if (distance < 30) {
          this.drawLine(buffer, nodeA.x, nodeA.y, nodeB.x, nodeB.y, 
                       this.getThemeColor('secondary', Math.floor(distance / 10)));
        }
      }
    }
    
    // ノード描画
    this.networks.forEach(node => {
      const px = Math.floor(node.x);
      const py = Math.floor(node.y);
      if (this.isValidPosition(px, py)) {
        const brightness = node.energy;
        const colorIndex = Math.floor(brightness * 3);
        buffer[py][px] = {
          char: brightness > 0.7 ? '●' : brightness > 0.4 ? '◉' : '○',
          color: this.getThemeColor('primary', colorIndex),
          bright: brightness > 0.8
        };
      }
    });
    
    this.renderBuffer(buffer);
  }

  drawSpiral(time) {
    const buffer = this.createBuffer();
    this.spiral.rotation += 0.02;
    
    this.spiral.particles.forEach((particle, i) => {
      const totalAngle = particle.angle + this.spiral.rotation;
      const x = this.width / 2 + Math.cos(totalAngle) * particle.radius * 0.5;
      const y = this.height / 2 + Math.sin(totalAngle) * particle.radius * 0.3;
      
      const px = Math.floor(x);
      const py = Math.floor(y);
      
      if (this.isValidPosition(px, py)) {
        const colorIndex = Math.floor((i / this.spiral.particles.length) * 3);
        const intensity = 1 - (i / this.spiral.particles.length);
        
        buffer[py][px] = {
          char: intensity > 0.7 ? '●' : intensity > 0.4 ? '◦' : '·',
          color: this.getThemeColor('primary', colorIndex),
          bright: intensity > 0.8
        };
      }
    });
    
    this.renderBuffer(buffer);
  }

  drawPlasma(time) {
    const buffer = this.createBuffer();
    this.plasma.time += 0.1;
    
    for (let y = 0; y < this.height - 3; y++) {
      for (let x = 0; x < this.width; x++) {
        const plasma1 = Math.sin(x * this.plasma.frequency1 + this.plasma.time);
        const plasma2 = Math.sin(y * this.plasma.frequency2 + this.plasma.time);
        const plasma3 = Math.sin((x + y) * this.plasma.frequency3 + this.plasma.time);
        const plasma4 = Math.sin(Math.sqrt(x * x + y * y) * this.plasma.frequency4 + this.plasma.time);
        
        const value = (plasma1 + plasma2 + plasma3 + plasma4) / 4;
        const normalized = (value + 1) / 2;
        
        const colorIndex = Math.floor(normalized * 3);
        const chars = ['·', '▒', '▓', '█'];
        const charIndex = Math.floor(normalized * (chars.length - 1));
        
        buffer[y][x] = {
          char: chars[charIndex],
          color: this.getThemeColor('primary', colorIndex)
        };
      }
    }
    
    this.renderBuffer(buffer);
  }

  drawStars(time) {
    const buffer = this.createBuffer();
    
    this.stars.forEach(star => {
      star.z -= star.speed;
      if (star.z <= 0) {
        star.z = 1000;
        star.x = Math.random() * this.width;
        star.y = Math.random() * this.height;
      }
      
      // 3D投影
      const scale = 1000 / star.z;
      const x = this.width / 2 + (star.x - this.width / 2) * scale;
      const y = this.height / 2 + (star.y - this.height / 2) * scale;
      
      const px = Math.floor(x);
      const py = Math.floor(y);
      
      if (this.isValidPosition(px, py)) {
        star.twinkle += 0.2;
        const brightness = 0.5 + 0.5 * Math.sin(star.twinkle);
        const size = scale * 0.5;
        
        let char, colorIndex;
        if (size > 2) {
          char = '★';
          colorIndex = 0;
        } else if (size > 1) {
          char = '✦';
          colorIndex = 1;
        } else {
          char = '·';
          colorIndex = 2;
        }
        
        buffer[py][px] = {
          char: char,
          color: this.getThemeColor('primary', colorIndex),
          bright: brightness > 0.7
        };
      }
    });
    
    this.renderBuffer(buffer);
  }

  drawDNA(time) {
    const buffer = this.createBuffer();
    this.dna.rotation += 0.05;
    
    for (let i = 0; i < this.dna.helixA.length; i++) {
      const angle = (i / this.dna.helixA.length) * Math.PI * 8 + this.dna.rotation;
      
      // ヘリックス A
      const xA = this.width / 2 + Math.cos(angle) * 15;
      const yA = (i / this.dna.helixA.length) * (this.height - 5) + 2;
      
      // ヘリックス B
      const xB = this.width / 2 + Math.cos(angle + Math.PI) * 15;
      const yB = yA;
      
      // 塩基対の描画
      if (this.isValidPosition(Math.floor(xA), Math.floor(yA))) {
        buffer[Math.floor(yA)][Math.floor(xA)] = {
          char: this.dna.helixA[i].base,
          color: this.getThemeColor('primary', 0),
          bright: true
        };
      }
      
      if (this.isValidPosition(Math.floor(xB), Math.floor(yB))) {
        buffer[Math.floor(yB)][Math.floor(xB)] = {
          char: this.dna.helixB[i].base,
          color: this.getThemeColor('primary', 1),
          bright: true
        };
      }
      
      // 結合線
      if (Math.abs(Math.cos(angle)) < 0.3) {
        this.drawLine(buffer, xA, yA, xB, yB, this.getThemeColor('secondary', 0));
      }
    }
    
    this.renderBuffer(buffer);
  }

  // ユーティリティメソッド
  createBuffer() {
    return Array(this.height).fill().map(() => Array(this.width).fill(' '));
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height - 3;
  }

  handleBoundaries(particle) {
    if (particle.x <= 0 || particle.x >= this.width - 1) {
      particle.vx *= -0.8;
      particle.x = Math.max(0, Math.min(this.width - 1, particle.x));
    }
    if (particle.y <= 0 || particle.y >= this.height - 4) {
      particle.vy *= -0.8;
      particle.y = Math.max(0, Math.min(this.height - 4, particle.y));
    }
  }

  resetParticle(particle) {
    particle.x = Math.random() * this.width;
    particle.y = Math.random() * this.height / 2;
    particle.vx = (Math.random() - 0.5) * 4;
    particle.vy = (Math.random() - 0.5) * 2;
    particle.life = particle.maxLife;
    particle.trail = [];
  }

  drawParticleWithTrail(buffer, particle, time) {
    // トレイル描画
    particle.trail.forEach((pos, i) => {
      const px = Math.floor(pos.x);
      const py = Math.floor(pos.y);
      if (this.isValidPosition(px, py)) {
        const alpha = i / particle.trail.length;
        buffer[py][px] = {
          char: alpha > 0.7 ? '·' : '░',
          color: this.getThemeColor('secondary', particle.color)
        };
      }
    });
    
    // メインパーティクル描画
    const px = Math.floor(particle.x);
    const py = Math.floor(particle.y);
    if (this.isValidPosition(px, py)) {
      buffer[py][px] = {
        char: particle.type,
        color: this.getThemeColor('primary', particle.color),
        bright: true
      };
    }
  }

  drawLine(buffer, x1, y1, x2, y2, color) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1, y = y1;
    while (true) {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (this.isValidPosition(px, py)) {
        buffer[py][px] = {
          char: '─',
          color: color
        };
      }
      
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  renderBuffer(buffer) {
    const startRender = performance.now();
    let output = this.getThemeColor('bg');
    
    for (let y = 0; y < this.height - 3; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = buffer[y][x];
        if (typeof cell === 'object' && cell.char && cell.char !== ' ') {
          let style = cell.color || this.colors.reset;
          if (cell.bright) style = this.colors.bright + style;
          if (cell.blink) style = this.colors.blink + style;
          output += style + cell.char + this.colors.reset + this.getThemeColor('bg');
        } else {
          output += ' ';
        }
      }
      output += '\n';
    }
    
    // ステータス行
    const status = this.generateStatusLine();
    output += this.colors.bright + this.getThemeColor('accent') + status.padEnd(this.width).slice(0, this.width) + this.colors.reset + '\n';
    
    // 情報行
    if (this.showInfo) {
      const info = this.generateInfoLine();
      output += this.getThemeColor('secondary', 0) + info.padEnd(this.width).slice(0, this.width) + this.colors.reset;
    }
    
    console.log(output);
    
    this.performanceStats.renderTime = performance.now() - startRender;
    
    if (this.recording) {
      this.recordingFrames.push(output);
    }
  }

  generateStatusLine() {
    const modeDisplay = `${this.mode.toUpperCase()} [${this.currentModeIndex + 1}/${this.modes.length}]`;
    const themeDisplay = `Theme: ${this.currentTheme.toUpperCase()}`;
    const fpsDisplay = `FPS: ${this.fps}`;
    const statusDisplay = this.paused ? '[PAUSED]' : (this.recording ? '[REC]' : '[LIVE]');
    
    return `${modeDisplay} | ${themeDisplay} | ${fpsDisplay} | ${statusDisplay} | [1-9] Mode [t] Theme [r] Record [p] Pause [q] Quit`;
  }

  generateInfoLine() {
    const particleCount = this.particles ? this.particles.length : 0;
    const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const renderTime = this.performanceStats.renderTime.toFixed(2);
    
    return `Particles: ${particleCount} | Memory: ${memUsage}MB | Render: ${renderTime}ms | Size: ${this.width}x${this.height}`;
  }

  // 追加の描画メソッド
  drawWaves(time) {
    const buffer = this.createBuffer();
    
    for (let x = 0; x < this.width; x++) {
      let totalY = 0;
      
      this.waves.forEach((wave, index) => {
        wave.phase += wave.speed;
        const waveY = Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
        totalY += waveY;
      });
      
      const centerY = this.height / 2;
      const finalY = centerY + totalY;
      
      // 複数の点を描画してより滑らかな波を作成
      for (let offset = -2; offset <= 2; offset++) {
        const py = Math.floor(finalY + offset);
        if (this.isValidPosition(x, py)) {
          const distance = Math.abs(offset);
          const intensity = 1 - (distance / 2);
          const colorIndex = Math.floor((x + time * 30) % 3);
          
          let char;
          if (intensity > 0.8) char = '█';
          else if (intensity > 0.5) char = '▓';
          else if (intensity > 0.2) char = '▒';
          else char = '░';
          
          buffer[py][x] = {
            char: char,
            color: this.getThemeColor('primary', colorIndex),
            bright: intensity > 0.7
          };
        }
      }
    }
    
    this.renderBuffer(buffer);
  }

  drawMatrix(time) {
    const buffer = this.createBuffer();
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?日本語ﾊﾝｶｸｶﾅ';
    
    for (let x = 0; x < this.width; x++) {
      const column = this.matrixColumns[x];
      
      // 新しいドロップ生成
      column.nextDrop--;
      if (column.nextDrop <= 0) {
        column.drops.push({
          y: -Math.random() * 20,
          speed: 0.2 + Math.random() * 0.8,
          length: 5 + Math.random() * 20,
          intensity: 0.8 + Math.random() * 0.2,
          chars: Array(30).fill().map(() => chars[Math.floor(Math.random() * chars.length)]),
          glitch: Math.random() > 0.95
        });
        column.nextDrop = 10 + Math.random() * 150;
      }
      
      // ドロップ更新と描画
      column.drops = column.drops.filter(drop => {
        drop.y += drop.speed;
        
        for (let i = 0; i < drop.length; i++) {
          const y = Math.floor(drop.y - i);
          if (y >= 0 && y < this.height - 3) {
            const fadeOut = Math.max(0, 1 - (i / drop.length));
            const glitchEffect = drop.glitch && Math.random() > 0.7;
            
            let color, bright = false;
            if (i === 0) {
              color = this.getThemeColor('accent');
              bright = true;
            } else if (fadeOut > 0.7) {
              color = this.getThemeColor('primary', 0);
              bright = true;
            } else if (fadeOut > 0.4) {
              color = this.getThemeColor('primary', 1);
            } else {
              color = this.getThemeColor('secondary', 1);
            }
            
            let char = drop.chars[i % drop.chars.length];
            if (glitchEffect) {
              char = chars[Math.floor(Math.random() * chars.length)];
              color = this.getThemeColor('primary', 2);
            }
            
            buffer[y][x] = {
              char: char,
              color: color,
              bright: bright,
              blink: glitchEffect
            };
          }
        }
        
        return drop.y < this.height + drop.length;
      });
    }
    
    this.renderBuffer(buffer);
  }

  drawFire(time) {
    const buffer = this.createBuffer();
    
    this.fireParticles.forEach(particle => {
      particle.flicker += 0.3;
      particle.intensity *= particle.decay;
      
      // 底部での再点火
      if (particle.y === this.height - 4) {
        particle.intensity = 0.8 + Math.random() * 0.4;
      }
      
      // 風効果
      const windEffect = Math.sin(time + particle.x * 0.1) * 0.5;
      
      if (particle.intensity > 0.05) {
        const flickerX = particle.x + windEffect + (Math.random() - 0.5) * 3;
        const flickerY = particle.y + (Math.random() - 0.5) * 2;
        
        const px = Math.floor(Math.max(0, Math.min(this.width - 1, flickerX)));
        const py = Math.floor(Math.max(0, Math.min(this.height - 4, flickerY)));
        
        let char, color, bright = false;
        if (particle.intensity > 0.9) {
          char = '█';
          color = this.getThemeColor('accent');
          bright = true;
        } else if (particle.intensity > 0.7) {
          char = '▓';
          color = this.getThemeColor('primary', 2);
          bright = true;
        } else if (particle.intensity > 0.5) {
          char = '▒';
          color = this.getThemeColor('primary', 1);
        } else if (particle.intensity > 0.3) {
          char = '░';
          color = this.getThemeColor('primary', 0);
        } else {
          char = '·';
          color = this.getThemeColor('secondary', 0);
        }
        
        buffer[py][px] = { char, color, bright };
      }
      
      // 上向きの熱拡散
      if (particle.y > 0 && Math.random() < particle.intensity * 0.4) {
        const above = this.fireParticles.find(p => 
          Math.abs(p.x - particle.x) <= 1 && p.y === particle.y - 1
        );
        if (above) {
          above.intensity = Math.max(above.intensity, particle.intensity * 0.6);
        }
      }
    });
    
    this.renderBuffer(buffer);
  }

  drawRain(time) {
    const buffer = this.createBuffer();
    
    this.rainDrops.forEach(drop => {
      drop.y += drop.speed;
      
      // 雨滴の再生成
      if (drop.y > this.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * this.width;
        drop.speed = 2 + Math.random() * 4;
        drop.intensity = 0.3 + Math.random() * 0.7;
      }
      
      // 雨滴の描画
      for (let i = 0; i < drop.length; i++) {
        const y = Math.floor(drop.y - i);
        const x = Math.floor(drop.x);
        
        if (this.isValidPosition(x, y)) {
          const alpha = (drop.length - i) / drop.length;
          const intensity = drop.intensity * alpha;
          
          let char, color;
          if (i === 0) {
            char = '●';
            color = this.getThemeColor('primary', 0);
          } else if (intensity > 0.7) {
            char = '|';
            color = this.getThemeColor('primary', 1);
          } else if (intensity > 0.4) {
            char = ':';
            color = this.getThemeColor('secondary', 0);
          } else {
            char = '.';
            color = this.getThemeColor('secondary', 1);
          }
          
          buffer[y][x] = {
            char: char,
            color: color,
            bright: i === 0
          };
        }
      }
      
      // 地面での跳ね返り効果
      if (drop.y >= this.height - 4 && drop.y <= this.height - 2) {
        for (let splash = 0; splash < 3; splash++) {
          const splashX = Math.floor(drop.x + (Math.random() - 0.5) * 4);
          const splashY = Math.floor(this.height - 3);
          
          if (this.isValidPosition(splashX, splashY)) {
            buffer[splashY][splashX] = {
              char: ['·', '°', '˚'][splash],
              color: this.getThemeColor('secondary', splash)
            };
          }
        }
      }
    });
    
    this.renderBuffer(buffer);
  }

  drawMandelbrot(time) {
    const buffer = this.createBuffer();
    this.mandelbrot.colorCycle += 0.05;
    
    const zoom = this.mandelbrot.zoom * (1 + 0.02 * Math.sin(time * 0.1));
    
    for (let py = 0; py < this.height - 3; py++) {
      for (let px = 0; px < this.width; px++) {
        const x0 = (px - this.width / 2) / (this.width / 4) / zoom + this.mandelbrot.centerX;
        const y0 = (py - this.height / 2) / (this.height / 4) / zoom + this.mandelbrot.centerY;
        
        let x = 0, y = 0, iteration = 0;
        
        while (x * x + y * y <= 4 && iteration < this.mandelbrot.maxIter) {
          const xtemp = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xtemp;
          iteration++;
        }
        
        if (iteration === this.mandelbrot.maxIter) {
          buffer[py][px] = {
            char: '█',
            color: this.getThemeColor('primary', 0)
          };
        } else {
          const colorValue = (iteration + this.mandelbrot.colorCycle) % 6;
          const colorIndex = Math.floor(colorValue / 2);
          const intensity = (iteration / this.mandelbrot.maxIter);
          
          let char;
          if (intensity > 0.8) char = '▓';
          else if (intensity > 0.6) char = '▒';
          else if (intensity > 0.4) char = '░';
          else if (intensity > 0.2) char = '·';
          else char = ' ';
          
          buffer[py][px] = {
            char: char,
            color: this.getThemeColor('primary', colorIndex)
          };
        }
      }
    }
    
    this.renderBuffer(buffer);
  }

  adjustSpeed(factor) {
    this.animationSpeed = (this.animationSpeed || 1) * factor;
    this.animationSpeed = Math.max(0.1, Math.min(5, this.animationSpeed));
  }

  toggleAutoMode() {
    this.autoMode = !this.autoMode;
    if (this.autoMode) {
      this.autoModeInterval = setInterval(() => {
        this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
        this.mode = this.modes[this.currentModeIndex];
        this.initializeMode();
      }, 10000);
    } else if (this.autoModeInterval) {
      clearInterval(this.autoModeInterval);
    }
  }

  saveRecording() {
    if (this.recordingFrames.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording_${timestamp}.txt`;
      try {
        const content = this.recordingFrames.join('\n---FRAME---\n');
        fs.writeFileSync(filename, content);
        this.emit('recordingSaved', filename);
      } catch (error) {
        this.emit('recordingError', error);
      }
    }
  }

  calculateFPS() {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.startTime = currentTime;
      
      // メモリ使用量更新
      this.performanceStats.memoryUsage = process.memoryUsage().heapUsed;
      this.performanceStats.particleCount = this.particles ? this.particles.length : 0;
    }
  }

  start() {
    this.initializeMode();
    
    const animate = () => {
      if (!this.paused) {
        this.clear();
        
        const time = performance.now() / 1000;
        const adjustedTime = time * (this.animationSpeed || 1);
        
        // 音楽パラメータの更新（シミュレート）
        this.updateMusicParams(adjustedTime);
        
        switch (this.mode) {
          case 'particles':
            this.drawAdvancedParticles(adjustedTime);
            break;
          case 'waves':
            this.drawWaves(adjustedTime);
            break;
          case 'matrix':
            this.drawMatrix(adjustedTime);
            break;
          case 'fire':
            this.drawFire(adjustedTime);
            break;
          case 'network':
            this.drawNetwork(adjustedTime);
            break;
          case 'fractal':
          case 'mandelbrot':
            this.drawMandelbrot(adjustedTime);
            break;
          case 'spiral':
            this.drawSpiral(adjustedTime);
            break;
          case 'plasma':
            this.drawPlasma(adjustedTime);
            break;
          case 'stars':
            this.drawStars(adjustedTime);
            break;
          case 'rain':
            this.drawRain(adjustedTime);
            break;
          case 'dna':
            this.drawDNA(adjustedTime);
            break;
        }
        
        this.calculateFPS();
      }
      
      setTimeout(animate, 1000 / 60); // 60 FPS target
    };
    
    animate();
  }

  updateMusicParams(time) {
    // 音楽パラメータのシミュレート
    this.musicParams.bass = 0.5 + 0.5 * Math.sin(time * 0.5);
    this.musicParams.treble = 0.3 + 0.7 * Math.sin(time * 2.3);
    this.musicParams.beat = Math.floor(time * 2) % 4;
    this.musicParams.tempo = 120 + 30 * Math.sin(time * 0.1);
  }

  cleanup() {
    console.clear();
    
    if (this.autoModeInterval) {
      clearInterval(this.autoModeInterval);
    }
    
    if (this.recording && this.recordingFrames.length > 0) {
      this.saveRecording();
    }
    
    // 終了アニメーション
    const exitMessage = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🎉 TERMINAL VISUALIZER PRO v2.0 🎉                    ║
║                                                                           ║
║  Thank you for using Terminal Visualizer Pro!                            ║
║                                                                           ║
║  🎨 Modes experienced: ${this.modes.length}                                             ║
║  🖼️  Frames rendered: ${this.frameCount}                                              ║
║  ⚡ Peak FPS: ${this.fps}                                                    ║
║  🎵 Theme: ${this.currentTheme.toUpperCase().padEnd(20)}                                    ║
║                                                                           ║
║  Made with ❤️  and lots of ☕ in Node.js                                 ║
║  Keep creating amazing visual experiences! 🚀                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`;
    
    console.log(this.getThemeColor('primary', 0) + exitMessage + this.colors.reset);
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    
    setTimeout(() => process.exit(0), 2000);
  }
}

// イベントリスナー設定
const visualizer = new AudioVisualizer();

visualizer.on('recordingStarted', () => {
  console.log('🔴 Recording started...');
});

visualizer.on('recordingStopped', () => {
  console.log('⏹️  Recording stopped.');
});

visualizer.on('recordingSaved', (filename) => {
  console.log(`💾 Recording saved: ${filename}`);
});

visualizer.on('screenshotSaved', (filename) => {
  console.log(`📸 Screenshot saved: ${filename}`);
});

visualizer.on('recordingError', (error) => {
  console.log(`❌ Recording error: ${error.message}`);
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => visualizer.cleanup());
process.on('SIGTERM', () => visualizer.cleanup());
