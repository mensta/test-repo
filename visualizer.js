#!/usr/bin/env node

const readline = require('readline');
const { performance } = require('perf_hooks');

class TerminalVisualizer {
  constructor() {
    this.width = process.stdout.columns || 80;
    this.height = process.stdout.rows || 24;
    this.particles = [];
    this.waves = [];
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      bg_black: '\x1b[40m',
      bg_red: '\x1b[41m',
      bg_green: '\x1b[42m',
      bg_yellow: '\x1b[43m',
      bg_blue: '\x1b[44m',
      bg_magenta: '\x1b[45m',
      bg_cyan: '\x1b[46m'
    };
    this.mode = 'particles';
    this.startTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
    
    // パーティクルシステム初期化
    this.initParticles();
    
    // 入力処理設定
    this.setupInput();
    
    console.log('🚀 Terminal Visualizer Started!');
    console.log('Controls: [1] Particles [2] Waves [3] Matrix [4] Fire [q] Quit');
    setTimeout(() => this.start(), 1000);
  }

  setupInput() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        this.cleanup();
      }
      
      switch (key.name) {
        case '1':
          this.mode = 'particles';
          this.initParticles();
          break;
        case '2':
          this.mode = 'waves';
          this.initWaves();
          break;
        case '3':
          this.mode = 'matrix';
          this.initMatrix();
          break;
        case '4':
          this.mode = 'fire';
          this.initFire();
          break;
        case 'q':
          this.cleanup();
          break;
      }
    });
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random() * 100,
        maxLife: 100,
        char: ['*', '·', '◦', '○', '●'][Math.floor(Math.random() * 5)]
      });
    }
  }

  initWaves() {
    this.waves = [];
    for (let i = 0; i < 5; i++) {
      this.waves.push({
        amplitude: 10 + Math.random() * 10,
        frequency: 0.1 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.05
      });
    }
  }

  initMatrix() {
    this.matrixColumns = [];
    for (let x = 0; x < this.width; x++) {
      this.matrixColumns[x] = {
        drops: [],
        nextDrop: Math.random() * 100
      };
    }
  }

  initFire() {
    this.fireParticles = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < 5; y++) {
        this.fireParticles.push({
          x: x,
          y: this.height - y - 1,
          intensity: Math.random(),
          decay: 0.95 + Math.random() * 0.04
        });
      }
    }
  }

  clear() {
    console.clear();
    process.stdout.write('\x1b[H');
  }

  drawParticles(time) {
    const buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    
    this.particles.forEach(particle => {
      // パーティクル移動
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      
      // 境界での反射
      if (particle.x <= 0 || particle.x >= this.width - 1) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(this.width - 1, particle.x));
      }
      if (particle.y <= 0 || particle.y >= this.height - 1) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(this.height - 1, particle.y));
      }
      
      // 重力効果
      particle.vy += 0.05;
      
      // パーティクル再生成
      if (particle.life <= 0) {
        particle.x = Math.random() * this.width;
        particle.y = Math.random() * this.height / 2;
        particle.vx = (Math.random() - 0.5) * 4;
        particle.vy = Math.random() * -2;
        particle.life = particle.maxLife;
      }
      
      // バッファに描画
      const px = Math.floor(particle.x);
      const py = Math.floor(particle.y);
      if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
        const lifeRatio = particle.life / particle.maxLife;
        const colorIndex = Math.floor((1 - lifeRatio) * 6);
        const colors = ['white', 'cyan', 'blue', 'magenta', 'red', 'yellow'];
        buffer[py][px] = {
          char: particle.char,
          color: colors[colorIndex] || 'white'
        };
      }
    });
    
    this.renderBuffer(buffer);
  }

  drawWaves(time) {
    const buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    
    for (let x = 0; x < this.width; x++) {
      let y = this.height / 2;
      
      this.waves.forEach(wave => {
        wave.phase += wave.speed;
        y += Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
      });
      
      const py = Math.floor(y);
      if (py >= 0 && py < this.height) {
        const hue = (x + time * 50) % 360;
        const colorIndex = Math.floor(hue / 60);
        const colors = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
        
        buffer[py][x] = {
          char: '█',
          color: colors[colorIndex]
        };
        
        // 波の軌跡
        for (let trail = 1; trail < 3; trail++) {
          if (py - trail >= 0) {
            buffer[py - trail][x] = {
              char: ['▓', '░'][trail - 1],
              color: colors[colorIndex]
            };
          }
          if (py + trail < this.height) {
            buffer[py + trail][x] = {
              char: ['▓', '░'][trail - 1],
              color: colors[colorIndex]
            };
          }
        }
      }
    }
    
    this.renderBuffer(buffer);
  }

  drawMatrix(time) {
    const buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    const chars = '0123456789ABCDEF日本語ﾊﾝｶｸｶﾅ';
    
    for (let x = 0; x < this.width; x++) {
      const column = this.matrixColumns[x];
      
      // 新しいドロップ生成
      column.nextDrop--;
      if (column.nextDrop <= 0) {
        column.drops.push({
          y: 0,
          speed: 0.3 + Math.random() * 0.7,
          length: 5 + Math.random() * 15,
          chars: Array(20).fill().map(() => chars[Math.floor(Math.random() * chars.length)])
        });
        column.nextDrop = 30 + Math.random() * 100;
      }
      
      // ドロップ更新と描画
      column.drops = column.drops.filter(drop => {
        drop.y += drop.speed;
        
        for (let i = 0; i < drop.length; i++) {
          const y = Math.floor(drop.y - i);
          if (y >= 0 && y < this.height) {
            const intensity = 1 - (i / drop.length);
            const color = i === 0 ? 'white' : (intensity > 0.7 ? 'green' : 'green');
            
            buffer[y][x] = {
              char: drop.chars[i % drop.chars.length],
              color: color,
              bright: i === 0
            };
          }
        }
        
        return drop.y < this.height + drop.length;
      });
    }
    
    this.renderBuffer(buffer);
  }

  drawFire(time) {
    const buffer = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    
    this.fireParticles.forEach(particle => {
      particle.intensity *= particle.decay;
      
      if (particle.y === this.height - 1) {
        particle.intensity = Math.random() * 1.2;
      }
      
      // 火の形状計算
      if (particle.intensity > 0.1) {
        const flickerX = particle.x + (Math.random() - 0.5) * 2;
        const flickerY = particle.y + (Math.random() - 0.5);
        
        const px = Math.floor(Math.max(0, Math.min(this.width - 1, flickerX)));
        const py = Math.floor(Math.max(0, Math.min(this.height - 1, flickerY)));
        
        let char, color;
        if (particle.intensity > 0.8) {
          char = '█';
          color = 'white';
        } else if (particle.intensity > 0.6) {
          char = '▓';
          color = 'yellow';
        } else if (particle.intensity > 0.4) {
          char = '▒';
          color = 'red';
        } else {
          char = '░';
          color = 'red';
        }
        
        buffer[py][px] = { char, color };
      }
      
      // 上向きの拡散
      if (particle.y > 0 && Math.random() < 0.3) {
        const above = this.fireParticles.find(p => 
          p.x === particle.x && p.y === particle.y - 1
        );
        if (above) {
          above.intensity = Math.max(above.intensity, particle.intensity * 0.8);
        }
      }
    });
    
    this.renderBuffer(buffer);
  }

  renderBuffer(buffer) {
    let output = '';
    
    for (let y = 0; y < this.height - 2; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = buffer[y][x];
        if (typeof cell === 'object' && cell.char) {
          let colorCode = this.colors[cell.color] || this.colors.white;
          if (cell.bright) colorCode = this.colors.bright + colorCode;
          output += colorCode + cell.char + this.colors.reset;
        } else {
          output += ' ';
        }
      }
      output += '\n';
    }
    
    // FPS とステータス表示
    const statusLine = `Mode: ${this.mode.toUpperCase()} | FPS: ${this.fps} | Frame: ${this.frameCount} | [1-4] Change Mode [q] Quit`;
    output += this.colors.bright + this.colors.cyan + statusLine.padEnd(this.width).slice(0, this.width) + this.colors.reset;
    
    console.log(output);
  }

  calculateFPS() {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.startTime = currentTime;
    }
  }

  start() {
    const animate = () => {
      this.clear();
      
      const time = performance.now() / 1000;
      
      switch (this.mode) {
        case 'particles':
          this.drawParticles(time);
          break;
        case 'waves':
          this.drawWaves(time);
          break;
        case 'matrix':
          this.drawMatrix(time);
          break;
        case 'fire':
          this.drawFire(time);
          break;
      }
      
      this.calculateFPS();
      
      setTimeout(animate, 1000 / 30); // 30 FPS
    };
    
    animate();
  }

  cleanup() {
    console.clear();
    console.log('\n🎉 Thanks for using Terminal Visualizer!');
    console.log('Made with ❤️  in Node.js\n');
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.exit(0);
  }
}

// 実行
console.log(`
╔══════════════════════════════════════════╗
║        🌟 TERMINAL VISUALIZER 🌟         ║
║                                          ║
║  A real-time visual experience in your   ║
║  terminal with particles, waves, matrix  ║
║  rain, and fire effects!                 ║
║                                          ║
║  Press 1-4 to switch modes               ║
║  Press 'q' to quit                       ║
╚══════════════════════════════════════════╝
`);

setTimeout(() => {
  new TerminalVisualizer();
}, 2000);
