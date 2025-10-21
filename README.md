# Barkour Game

A browser-based endless runner game inspired by Chrome's T-Rex game, featuring custom dog characters and a Mario-themed aesthetic.

## Features

- **Character Selection**: Choose between two playable dog characters
- **T-Rex Game Mechanics**: Authentic jump physics and difficulty progression
- **Mario-Inspired Theme**: Classic pixel art style with Mario color palette
- **High Score Tracking**: Persistent high scores using localStorage
- **Responsive Controls**: Keyboard and touch controls for desktop and mobile
- **Mobile Optimized**: Full touch support with swipe and tap gestures
- **Cross-Platform**: Works on desktop browsers and mobile devices

## How to Play

### Running the Game

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. The game will load automatically

### Controls

#### Desktop (Keyboard)
- **Arrow Keys**: Navigate character/speed selection
- **Spacebar**: Jump / Start game / Restart
- **Enter**: Confirm selection
- **C**: Return to character selection (from Game Over screen)

#### Desktop (Mouse)
- **Click Left/Right Side**: Navigate character selection
- **Click Top/Bottom**: Navigate speed selection
- **Click Center**: Confirm selection and start
- **Click Anywhere**: Jump during gameplay
- **Click Upper Area**: Restart game (on Game Over)
- **Click Lower Area**: Return to menu (on Game Over)

#### Mobile (Touch)
- **Tap/Swipe Left-Right**: Navigate character selection
- **Tap/Swipe Up-Down**: Navigate speed selection
- **Tap Center**: Confirm selection and start
- **Tap Anywhere**: Jump during gameplay
- **Tap Upper Area**: Restart game (on Game Over)
- **Tap Lower Area**: Return to menu (on Game Over)

📱 *See [MOBILE_CONTROLS.md](MOBILE_CONTROLS.md) for detailed touch controls guide*

### Gameplay

1. **Select Your Dog**: Use arrow keys to choose between the two dog characters, then press Space to start
2. **Jump Over Obstacles**: Press spacebar to jump over pipes and enemies
3. **Survive as Long as Possible**: The game gets progressively faster
4. **Beat Your High Score**: Try to beat your personal best!

## Project Structure

```
barkour-claude/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Game styling
├── js/
│   ├── game.js            # Main game loop and state management
│   ├── character.js       # Dog character class
│   ├── obstacle.js        # Obstacle classes (Pipe, Goomba)
│   ├── background.js      # Background rendering (clouds, ground)
│   ├── collision.js       # Collision detection logic
│   ├── input.js           # Keyboard input handling
│   ├── storage.js         # localStorage utilities
│   └── constants.js       # Game constants and configuration
├── assets/
│   └── sprites/
│       ├── dog1.svg       # Dog character 1 (PLACEHOLDER)
│       ├── dog2.svg       # Dog character 2 (PLACEHOLDER)
│       ├── pipe.svg       # Pipe obstacle
│       ├── goomba.svg     # Goomba enemy
│       └── cloud.svg      # Cloud decoration
├── PRD.md                 # Product Requirements Document
└── claude.md              # Implementation Guide
```

## Customization

### Replacing Dog Sprites

The current dog sprites (`dog1.svg` and `dog2.svg`) are placeholders. To use your own dog images:

1. Replace `assets/sprites/dog1.svg` with your first dog's 16x16 bitmap (PNG or SVG)
2. Replace `assets/sprites/dog2.svg` with your second dog's 16x16 bitmap (PNG or SVG)
3. Ensure the images have transparent backgrounds
4. The game will automatically scale them to 32x32 for display

**Recommended format**: PNG with transparency, 16x16 pixels

### Adjusting Game Difficulty

Edit `js/constants.js` to modify game parameters:

```javascript
// Make the game easier
INITIAL_SPEED: 4,           // Default: 6
SPEED_INCREMENT: 0.0005,    // Default: 0.001

// Make jumps higher
JUMP_VELOCITY: -12,         // Default: -10

// Space out obstacles more
MIN_OBSTACLE_DISTANCE: 300, // Default: 200
MAX_OBSTACLE_DISTANCE: 800, // Default: 600
```

### Changing Colors

Edit the color palette in `js/constants.js`:

```javascript
COLORS: {
    SKY_BLUE: '#5C94FC',
    GROUND_BROWN: '#C84C0C',
    PIPE_GREEN: '#00A800',
    // ... etc
}
```

## Game Mechanics

### Physics
- **Gravity**: 0.6 pixels/frame²
- **Jump Velocity**: -10 pixels/frame
- **Initial Speed**: 6 pixels/frame
- **Max Speed**: 13 pixels/frame
- **Speed Increase**: 0.001 pixels/frame

### Obstacles
- **Pipes**: Green pipes in various heights (40-80px)
- **Goombas**: Walking mushroom enemies (16x16)
- **Spawn Distance**: 200-600 pixels apart

### Scoring
- Score increases based on distance traveled
- +0.5 points per frame
- High score persists between sessions

## Browser Compatibility

### Desktop
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- iOS Safari 14+
- Chrome for Android
- Firefox for Android
- Samsung Internet

Requires support for:
- HTML5 Canvas
- ES6 JavaScript
- localStorage
- CSS3
- Touch Events API (for mobile)

## Development

### Debug Mode

To enable hitbox visualization, uncomment the debug lines in:
- `js/character.js` (line ~66)
- `js/obstacle.js` (line ~23)

This will show collision boxes in red/blue for easier debugging.

### Performance

The game targets 60 FPS and uses:
- `requestAnimationFrame` for smooth animations
- Pixel-perfect rendering (no image smoothing)
- Efficient canvas clearing and redrawing
- Obstacle cleanup (removes off-screen objects)

## Known Issues

- None currently! Report issues if you find any.

## Future Enhancements

See `PRD.md` for a full list of potential future features:
- Power-ups (mushrooms, stars)
- Multiple worlds/backgrounds
- Sound effects and music
- Additional dog characters
- Achievements system
- Progressive Web App (PWA) support for offline play

## Credits

- Inspired by Chrome's T-Rex game
- Mario-themed aesthetic inspired by Nintendo's Super Mario Bros
- Created for Sagar's dogs

## License

This is a personal project. Feel free to modify and customize for your own use!

---

**Enjoy playing Barkour!**
