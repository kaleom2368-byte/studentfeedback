import pygame
import math
import sys

# 1. Setup window dimensions
WIDTH, HEIGHT = 800, 600

# 2. Define the Leg class (Inferred from the original snippet)
class Leg:
    def __init__(self, side, anchor_idx, is_front):
        self.side = side            # -1 for left, 1 for right
        self.anchor_idx = anchor_idx # Which spine joint it connects to
        self.is_front = is_front    # True for front legs, False for back legs
        self.foot = pygame.Vector2(0, 0)

    def update(self, anchor_pos):
        # Place the foot slightly offset relative to its spine connection point
        self.foot = pygame.Vector2(
            anchor_pos.x + self.side * 70, 
            anchor_pos.y + 70
        )

    def draw(self, surface, anchor_pos):
        # Draw a simple leg segment connecting the spine to the foot
        pygame.draw.line(surface, (255, 255, 255), anchor_pos, self.foot, 3)
        pygame.draw.circle(surface, (200, 200, 200), (int(self.foot.x), int(self.foot.y)), 5)

def main():
    # Initialize pygame and window
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Realistic Procedural Skeleton")
    clock = pygame.time.Clock()

    # Configuration variables
    num_vertebrae = 22
    
    # Create the backbone (spine) list
    spine = [pygame.Vector2(WIDTH // 2, HEIGHT // 2) for _ in range(num_vertebrae)]
    angles = [0.0] * num_vertebrae

    # Instantiate the legs array
    legs = []
    legs.append(Leg(-1, 4, True))
    legs.append(Leg(1, 4, True))
    legs.append(Leg(-1, 14, False))
    legs.append(Leg(1, 14, False))

    # Main Game/Animation loop
    running = True
    time_passed = 0
    
    while running:
        # Handle closing the window safely
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # --- UPDATE LOGIC ---
        time_passed += 0.05
        
        # Make the head move in a gentle infinity/wave pattern for demonstration
        spine[0].x = WIDTH // 2 + math.sin(time_passed) * 100
        spine[0].y = HEIGHT // 2 + math.cos(time_passed * 2) * 50

        # Make the rest of the spine follow the head procedurally
        segment_length = 15
        for i in range(1, num_vertebrae):
            dir_vector = spine[i] - spine[i-1]
            if dir_vector.length() > 0:
                dir_vector = dir_vector.normalize()
                spine[i] = spine[i-1] + dir_vector * segment_length

        # Update leg positions based on their connected spine index
        for l in legs:
            anc = spine[l.anchor_idx]
            l.update(anc)

        # --- DRAW LOGIC ---
        screen.fill((30, 30, 40)) # Dark background

        # Draw the spine segments
        for i in range(num_vertebrae - 1):
            pygame.draw.line(screen, (255, 255, 255), spine[i], spine[i+1], 4)
            pygame.draw.circle(screen, (200, 200, 200), (int(spine[i].x), int(spine[i].y)), 6)

        # Draw the legs
        for l in legs:
            anc = spine[l.anchor_idx]
            l.draw(screen, anc)

        pygame.display.flip()
        clock.tick(60) # Limits environment to 60 FPS

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()