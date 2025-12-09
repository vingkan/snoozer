export interface Seat {
  id: number;
  x: number;
  y: number;
  employee: string;
  isFloater: boolean;
  block: string;
  score?: number;
  scoreName?: string;
  scoreDescription?: string;
}

export interface Area {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface OfficeLayout {
  seats: Seat[];
  areas: Area[];
  width: number;
  height: number;
}

// Seat data based on the office map
const seatData: Omit<Seat, "x" | "y">[] = [
  // Block 1 (Below IP Conference Room)
  { id: 1, employee: "Chris Laganiere", isFloater: false, block: "block1" },
  { id: 2, employee: "Kabir Mahal", isFloater: false, block: "block1" },
  { id: 3, employee: "Adam Z", isFloater: false, block: "block1" },
  { id: 4, employee: "Sparsh Agarwal", isFloater: false, block: "block1" },
  { id: 8, employee: "Vinesh K", isFloater: false, block: "block1" },
  { id: 9, employee: "Rachel Rivera", isFloater: false, block: "block1" },
  { id: 10, employee: "Sahil", isFloater: false, block: "block1" },
  { id: 11, employee: "Javier", isFloater: false, block: "block1" },

  // Block 2 (To the right of Block 1, below Mini Lounge Area)
  { id: 5, employee: "Aditya Prabhakar", isFloater: false, block: "block2" },
  { id: 6, employee: "Helen (Xiaohan) Xue", isFloater: false, block: "block2" },
  { id: 7, employee: "Ajinkya Bari", isFloater: false, block: "block2" },
  {
    id: 12,
    employee: "Dhruven Shah / Eshwar",
    isFloater: false,
    block: "block2",
  },
  { id: 13, employee: "Ryan Schwers", isFloater: false, block: "block2" },
  { id: 14, employee: "Dave Makhervaks", isFloater: false, block: "block2" },

  // Block 3 (Left side of Area-2)
  { id: 15, employee: "Sam Puth", isFloater: false, block: "block3" },
  { id: 16, employee: "Arnelle Chang", isFloater: false, block: "block3" },
  { id: 17, employee: "Allison Chuang", isFloater: false, block: "block3" },
  { id: 18, employee: "Allie Ivener", isFloater: false, block: "block3" },
  { id: 22, employee: "Jason", isFloater: false, block: "block3" },
  { id: 23, employee: "Ani", isFloater: false, block: "block3" },
  { id: 24, employee: "Cullen McMahon", isFloater: false, block: "block3" },
  { id: 25, employee: "Ryan Douglas", isFloater: false, block: "block3" },

  // Block 4 (Right side of Area-2)
  { id: 19, employee: "Omri Nachmani", isFloater: false, block: "block4" },
  { id: 20, employee: "Madeline Grade", isFloater: false, block: "block4" },
  { id: 21, employee: "Patrick vn", isFloater: false, block: "block4" },
  { id: 26, employee: "Justin Krogue", isFloater: false, block: "block4" },
  { id: 27, employee: "Mehr Kashyap", isFloater: false, block: "block4" },
  { id: 28, employee: "Eric Hunter", isFloater: false, block: "block4" },

  // Block 5 (Below Area-2, left side)
  { id: 29, employee: "Sachin Muraldihara", isFloater: false, block: "block5" },
  { id: 30, employee: "Chinmay Vinchurkar", isFloater: false, block: "block5" },
  { id: 31, employee: "Julie", isFloater: false, block: "block5" },
  { id: 35, employee: "Andrew Jones", isFloater: false, block: "block5" },
  { id: 36, employee: "Ebube", isFloater: false, block: "block5" },
  { id: 37, employee: "Morgan Davis", isFloater: false, block: "block5" },

  // Block 6 (Below Area-2, right side)
  {
    id: 32,
    employee: "Kelly McDonald / Jared Hu",
    isFloater: false,
    block: "block6",
  },
  { id: 33, employee: "Nikolai Oudalov", isFloater: false, block: "block6" },
  { id: 34, employee: "Stephane Colas", isFloater: false, block: "block6" },
  { id: 38, employee: "Lillian Cartwright", isFloater: false, block: "block6" },
  { id: 39, employee: "Lindsay Maher", isFloater: false, block: "block6" },
  { id: 40, employee: "Arvil Nagpal", isFloater: false, block: "block6" },

  // Block 7 & 8 (Near Hallway - FLOATER seats)
  { id: 41, employee: "Free (FLOATER)", isFloater: true, block: "block7" },
  { id: 42, employee: "Free (FLOATER)", isFloater: true, block: "block7" },
  { id: 43, employee: "Free (FLOATER)", isFloater: true, block: "block8" },
  { id: 44, employee: "Free (FLOATER)", isFloater: true, block: "block8" },
  { id: 45, employee: "Free (FLOATER)", isFloater: true, block: "block8" },
];

// Calculate positions for seats based on block layout
function calculateSeatPositions(): Seat[] {
  const seatSize = 40;
  const seatSpacing = 10;
  const blockSpacing = 60;

  // Block 1: 4x2 grid (1,2,3,4 top row; 8,9,10,11 bottom row)
  const block1StartX = 100;
  const block1StartY = 200;
  const block1Seats = [1, 2, 3, 4, 8, 9, 10, 11];

  // Block 2: 3x2 grid (5,6,7 top row; 12,13,14 bottom row)
  const block2StartX =
    block1StartX + 4 * (seatSize + seatSpacing) + blockSpacing;
  const block2StartY = block1StartY;
  const block2Seats = [5, 6, 7, 12, 13, 14];

  // Block 3: 4x2 grid (15,16,17,18 top row; 22,23,24,25 bottom row)
  const block3StartX = block1StartX;
  const block3StartY =
    block1StartY + 2 * (seatSize + seatSpacing) + blockSpacing;
  const block3Seats = [15, 16, 17, 18, 22, 23, 24, 25];

  // Block 4: 3x2 grid (19,20,21 top row; 26,27,28 bottom row)
  const block4StartX = block2StartX;
  const block4StartY = block3StartY;
  const block4Seats = [19, 20, 21, 26, 27, 28];

  // Block 5: 3x2 grid (29,30,31 top row; 35,36,37 bottom row)
  const block5StartX = block1StartX;
  const block5StartY =
    block3StartY + 2 * (seatSize + seatSpacing) + blockSpacing;
  const block5Seats = [29, 30, 31, 35, 36, 37];

  // Block 6: 3x2 grid (32,33,34 top row; 38,39,40 bottom row)
  const block6StartX = block2StartX;
  const block6StartY = block5StartY;
  const block6Seats = [32, 33, 34, 38, 39, 40];

  // Block 7: 1x2 row (41,42)
  const block7StartX = block1StartX;
  const block7StartY =
    block5StartY + 2 * (seatSize + seatSpacing) + blockSpacing + 80;
  const block7Seats = [41, 42];

  // Block 8: 1x3 row (43,44,45)
  const block8StartX =
    block7StartX + 2 * (seatSize + seatSpacing) + blockSpacing;
  const block8StartY = block7StartY;
  const block8Seats = [43, 44, 45];

  const seatMap = new Map<
    number,
    { x: number; y: number; col: number; row: number }
  >();

  // Helper to add seats for a block
  const addBlockSeats = (
    startX: number,
    startY: number,
    seats: number[],
    cols: number
  ) => {
    seats.forEach((seatId, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      seatMap.set(seatId, {
        x: startX + col * (seatSize + seatSpacing),
        y: startY + row * (seatSize + seatSpacing),
        col,
        row,
      });
    });
  };

  addBlockSeats(block1StartX, block1StartY, block1Seats, 4);
  addBlockSeats(block2StartX, block2StartY, block2Seats, 3);
  addBlockSeats(block3StartX, block3StartY, block3Seats, 4);
  addBlockSeats(block4StartX, block4StartY, block4Seats, 3);
  addBlockSeats(block5StartX, block5StartY, block5Seats, 3);
  addBlockSeats(block6StartX, block6StartY, block6Seats, 3);
  addBlockSeats(block7StartX, block7StartY, block7Seats, 2);
  addBlockSeats(block8StartX, block8StartY, block8Seats, 3);

  return seatData.map((seat) => {
    const pos = seatMap.get(seat.id);
    if (!pos) {
      throw new Error(`Position not found for seat ${seat.id}`);
    }
    return {
      ...seat,
      x: pos.x,
      y: pos.y,
    };
  });
}

// Scoring factors and weights
interface ScoreFactors {
  distanceToVinesh: number;
  distanceToLeftWall: number;
  distanceToNorthWall: number;
  distanceToTopRightCorner: number;
  distanceToBottomMiddle: number;
}

function calculateEuclideanDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function calculateScoreFactors(
  seat: Seat,
  vineshSeat: Seat,
  layoutWidth: number,
  layoutHeight: number
): ScoreFactors {
  // Distance to Vinesh (closer = worse)
  const distanceToVinesh = calculateEuclideanDistance(
    seat.x,
    seat.y,
    vineshSeat.x,
    vineshSeat.y
  );

  // Distance to left wall (closer = better, natural light)
  const distanceToLeftWall = seat.x;

  // Distance to north wall (closer = better, natural light)
  const distanceToNorthWall = seat.y;

  // Distance to top-right corner (closer = better, bathroom access)
  const topRightX = layoutWidth;
  const topRightY = 0;
  const distanceToTopRightCorner = calculateEuclideanDistance(
    seat.x,
    seat.y,
    topRightX,
    topRightY
  );

  // Distance to bottom-middle (closer = better, bathroom access)
  const bottomMiddleX = layoutWidth / 2;
  const bottomMiddleY = layoutHeight;
  const distanceToBottomMiddle = calculateEuclideanDistance(
    seat.x,
    seat.y,
    bottomMiddleX,
    bottomMiddleY
  );

  return {
    distanceToVinesh,
    distanceToLeftWall,
    distanceToNorthWall,
    distanceToTopRightCorner,
    distanceToBottomMiddle,
  };
}

function generateScoreDescription(normalizedFactors: ScoreFactors): string {
  const descriptions: string[] = [];

  // Check natural light factors
  const hasNaturalLight =
    normalizedFactors.distanceToLeftWall < 0.3 ||
    normalizedFactors.distanceToNorthWall < 0.3;
  const closeToVinesh = normalizedFactors.distanceToVinesh < 0.3;

  // Check bathroom access
  const closeToTopRight = normalizedFactors.distanceToTopRightCorner < 0.3;
  const closeToBottomMiddle = normalizedFactors.distanceToBottomMiddle < 0.3;
  const hasBathroomAccess = closeToTopRight || closeToBottomMiddle;

  // Check distance from Vinesh
  const farFromVinesh = normalizedFactors.distanceToVinesh > 0.7;

  if (hasNaturalLight && closeToVinesh) {
    descriptions.push("Natural light, but close to Vinesh");
  } else if (hasNaturalLight && farFromVinesh) {
    descriptions.push("Natural light, far from Vinesh");
  } else if (hasNaturalLight) {
    descriptions.push("Natural light");
  }

  if (hasBathroomAccess && farFromVinesh) {
    descriptions.push("Easy bathroom access, far from Vinesh");
  } else if (hasBathroomAccess && closeToVinesh) {
    descriptions.push("Easy bathroom access, but close to Vinesh");
  } else if (hasBathroomAccess) {
    descriptions.push("Easy bathroom access");
  }

  if (!hasNaturalLight && !hasBathroomAccess && farFromVinesh) {
    descriptions.push("Far from Vinesh");
  } else if (!hasNaturalLight && !hasBathroomAccess && closeToVinesh) {
    descriptions.push("Close to Vinesh");
  }

  return descriptions.length > 0 ? descriptions.join(", ") : "Standard seat";
}

function calculateSeatScores(
  seats: Seat[],
  layoutWidth: number,
  layoutHeight: number
): Seat[] {
  // Find Vinesh's seat dynamically
  const vineshSeat = seats.find((seat) =>
    seat.employee.toLowerCase().includes("vinesh")
  );

  if (!vineshSeat) {
    console.warn("Vinesh's seat not found, skipping score calculation");
    return seats;
  }

  // Calculate raw scores for all seats
  const seatScores = seats.map((seat) => {
    const factors = calculateScoreFactors(
      seat,
      vineshSeat,
      layoutWidth,
      layoutHeight
    );

    // Find max distances for normalization
    const maxDistances: ScoreFactors = {
      distanceToVinesh: Math.max(
        ...seats.map((s) =>
          calculateEuclideanDistance(s.x, s.y, vineshSeat.x, vineshSeat.y)
        )
      ),
      distanceToLeftWall: Math.max(...seats.map((s) => s.x)),
      distanceToNorthWall: Math.max(...seats.map((s) => s.y)),
      distanceToTopRightCorner: Math.max(
        ...seats.map((s) =>
          calculateEuclideanDistance(s.x, s.y, layoutWidth, 0)
        )
      ),
      distanceToBottomMiddle: Math.max(
        ...seats.map((s) =>
          calculateEuclideanDistance(s.x, s.y, layoutWidth / 2, layoutHeight)
        )
      ),
    };

    // Normalize factors to 0-1 range
    const normalizedFactors: ScoreFactors = {
      distanceToVinesh:
        factors.distanceToVinesh / maxDistances.distanceToVinesh,
      distanceToLeftWall:
        factors.distanceToLeftWall / maxDistances.distanceToLeftWall,
      distanceToNorthWall:
        factors.distanceToNorthWall / maxDistances.distanceToNorthWall,
      distanceToTopRightCorner:
        factors.distanceToTopRightCorner /
        maxDistances.distanceToTopRightCorner,
      distanceToBottomMiddle:
        factors.distanceToBottomMiddle / maxDistances.distanceToBottomMiddle,
    };

    // Calculate raw score (higher is better)
    // Weights: Vinesh distance (positive - farther is better), natural light (positive), bathroom access (positive)
    const rawScore =
      normalizedFactors.distanceToVinesh * 0.4 + // Farther from Vinesh = better
      (1 - normalizedFactors.distanceToLeftWall) * 0.2 + // Closer to left wall = better
      (1 - normalizedFactors.distanceToNorthWall) * 0.2 + // Closer to north wall = better
      (1 - normalizedFactors.distanceToTopRightCorner) * 0.1 + // Closer to top-right = better
      (1 - normalizedFactors.distanceToBottomMiddle) * 0.1; // Closer to bottom-middle = better

    return {
      seat,
      rawScore,
      factors,
      normalizedFactors,
      maxDistances,
    };
  });

  // Sort by raw score and assign bins for even distribution
  seatScores.sort((a, b) => a.rawScore - b.rawScore);

  const totalSeats = seatScores.length;
  // Calculate bin sizes for even distribution (10% per score)
  const seatsPerBin = totalSeats / 10;

  return seatScores.map((item, index) => {
    let score: number;
    let scoreName: string;

    // Assign scores with even distribution
    // Bottom 10%: score 1
    // Next 10%: score 2
    // Next 10%: score 3
    // Next 10%: score 4
    // Next 10%: score 5
    // Next 10%: score 6
    // Next 10%: score 7
    // Next 10%: score 8
    // Next 10%: score 9
    // Top 10%: score 10

    const binNumber = Math.floor(index / seatsPerBin);

    if (binNumber < 3) {
      // Scores 1-3: Subpar
      score = binNumber + 1;
      scoreName = "Subpar";
    } else if (binNumber < 6) {
      // Scores 4-6: Good
      score = binNumber + 1;
      scoreName = "Good";
    } else if (binNumber < 9) {
      // Scores 7-9: Great
      score = binNumber + 1;
      scoreName = "Great";
    } else {
      // Score 10: Amazing
      score = 10;
      scoreName = "Amazing";
    }

    const description = generateScoreDescription(item.normalizedFactors);

    return {
      ...item.seat,
      score,
      scoreName,
      scoreDescription: description,
    };
  });
}

const seatsWithPositions = calculateSeatPositions();

export const officeLayout: OfficeLayout = {
  seats: calculateSeatScores(seatsWithPositions, 800, 850),
  areas: [
    {
      id: "ip-conference",
      name: "IP Conference Room",
      x: 50,
      y: 50,
      width: 300,
      height: 120,
      color: "#dc2626", // red
    },
    {
      id: "mini-lounge",
      name: "Mini Lounge Area",
      x: 400,
      y: 50,
      width: 250,
      height: 120,
      color: "#9333ea", // purple
    },
    {
      id: "area-2",
      name: "Area-2",
      x: 50,
      y: 350,
      width: 600,
      height: 200,
      color: "#e5e7eb", // light gray
    },
    {
      id: "hallway",
      name: "Hallway",
      x: 200,
      y: 700,
      width: 300,
      height: 60,
      color: "#d1d5db", // light grey
    },
  ],
  width: 800,
  height: 850,
};
