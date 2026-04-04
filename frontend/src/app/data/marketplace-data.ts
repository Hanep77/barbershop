// Mock data for the Multi-Tenant Marketplace

export interface Barbershop {
  id: number;
  name: string;
  location: string;
  distance: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  hours: {
    [key: string]: string;
  };
  coverImage: string;
  gallery: string[];
  specialties?: string[]; // Added for AI filtering
}

export interface Service {
  id: number;
  barbershopId: number;
  name: string;
  price: string;
  duration: string;
  description: string;
}

export interface Barber {
  id: number;
  barbershopId: number;
  name: string;
  title: string;
  experience: string;
  rating: number;
  specialties: string[];
  bio: string;
  image: string;
}

export interface Booking {
  id: number;
  barbershopId: number;
  barbershopName: string;
  barbershopLocation: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  price: string;
  status: "upcoming" | "completed";
}

// Extended Admin Booking interface
export interface AdminBooking {
  id: number;
  customer: string;
  customerEmail: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  price: string;
  notes?: string;
}

// AI Consultant Data Structures
export type FaceShape = "oval" | "square" | "round" | "heart" | "diamond" | "oblong";

export interface HairstyleRecommendation {
  id: number;
  name: string;
  faceShapes: FaceShape[];
  description: string;
  image: string;
  tags: string[];
  difficulty: "easy" | "medium" | "advanced";
}

export interface FaceAnalysisResult {
  faceShape: FaceShape;
  confidence: number;
  features: {
    jawline: string;
    cheekbones: string;
    foreheadWidth: string;
  };
  recommendations: HairstyleRecommendation[];
}

// Hairstyle Recommendations Database
export const hairstyleRecommendations: HairstyleRecommendation[] = [
  {
    id: 1,
    name: "Classic Pompadour",
    faceShapes: ["oval", "square", "diamond"],
    description: "Voluminous top with short sides. Adds height and creates balanced proportions. Perfect for professional and casual settings.",
    image: "https://images.unsplash.com/photo-1604160450680-b749dfebab6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwcG9tcGFkb3VyJTIwaGFpcnN0eWxlfGVufDF8fHx8MTc3Mzk5MjEzNnww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Classic", "Professional", "Timeless"],
    difficulty: "medium",
  },
  {
    id: 2,
    name: "Textured Crop",
    faceShapes: ["round", "square", "oval"],
    description: "Short, textured cut with a defined fringe. Creates angles and adds visual length. Low maintenance and modern.",
    image: "https://images.unsplash.com/photo-1657878337741-f805bb68b4b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0dXJlZCUyMGNyb3AlMjBoYWlyY3V0JTIwbWFsZXxlbnwxfHx8fDE3NzM5OTIxMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Modern", "Textured", "Low Maintenance"],
    difficulty: "easy",
  },
  {
    id: 3,
    name: "Side Part Fade",
    faceShapes: ["oval", "oblong", "square"],
    description: "Clean side part with gradual fade. Sophisticated and versatile. Works for all occasions.",
    image: "https://images.unsplash.com/photo-1690028377764-b038477bc7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWRlJTIwcGFydCUyMGZhZGUlMjBoYWlyY3V0fGVufDF8fHx8MTc3Mzk5MjEzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Classic", "Fade", "Versatile"],
    difficulty: "medium",
  },
  {
    id: 4,
    name: "Messy Quiff",
    faceShapes: ["oval", "heart", "diamond"],
    description: "Relaxed, voluminous front with textured styling. Adds height while maintaining a casual vibe.",
    image: "https://images.unsplash.com/photo-1571565112616-eb30fab8bcf7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXNzeSUyMHF1aWZmJTIwaGFpcnN0eWxlfGVufDF8fHx8MTc3Mzk5MjEzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Casual", "Textured", "Trendy"],
    difficulty: "easy",
  },
  {
    id: 5,
    name: "Buzz Cut with Line Up",
    faceShapes: ["oval", "square", "round"],
    description: "Ultra-short with sharp edge work. Emphasizes bone structure and requires minimal styling.",
    image: "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXp6JTIwY3V0JTIwbGluZXVwJTIwYmFyYmVyfGVufDF8fHx8MTc3Mzk5MjEzOHww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Clean", "Low Maintenance", "Bold"],
    difficulty: "easy",
  },
  {
    id: 6,
    name: "Slick Back",
    faceShapes: ["oval", "oblong", "diamond"],
    description: "Combed back with shine. Elongates the face and exudes confidence. Best for formal settings.",
    image: "https://images.unsplash.com/photo-1762106383160-24b6ef8f762d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbGlja2VkJTIwYmFjayUyMGhhaXIlMjBtYWxlfGVufDF8fHx8MTc3Mzk5MjEzOHww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Formal", "Sleek", "Classic"],
    difficulty: "medium",
  },
  {
    id: 7,
    name: "Curly Fringe",
    faceShapes: ["round", "square", "heart"],
    description: "Natural curls with defined fringe. Adds softness and frames the face beautifully.",
    image: "https://images.unsplash.com/photo-1629613378258-fa6b82a22dcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXJseSUyMGZyaW5nZSUyMG1hbGUlMjBoYWlyc3R5bGV8ZW58MXx8fHwxNzczOTkyMTM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Natural", "Curly", "Soft"],
    difficulty: "easy",
  },
  {
    id: 8,
    name: "High and Tight",
    faceShapes: ["square", "oval", "diamond"],
    description: "Military-inspired with very short sides and slightly longer top. Sharp and masculine.",
    image: "https://images.unsplash.com/photo-1543697506-6729425f7265?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdoJTIwdGlnaHQlMjBtaWxpdGFyeSUyMGhhaXJjdXR8ZW58MXx8fHwxNzczOTkyMTM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Military", "Sharp", "Masculine"],
    difficulty: "easy",
  },
];

// Face Shape Descriptions
export const faceShapeDescriptions: Record<FaceShape, string> = {
  oval: "Balanced proportions with gentle curves. The most versatile face shape - almost any hairstyle works!",
  square: "Strong jawline with equal width and length. Angular features benefit from soft, textured styles.",
  round: "Soft curves with similar width and length. Hairstyles with height and angles create visual length.",
  heart: "Wider forehead tapering to a narrow chin. Styles with volume at the bottom balance the proportions.",
  diamond: "Narrow forehead and chin with wide cheekbones. Styles that add width at the forehead work best.",
  oblong: "Longer face with similar width throughout. Styles with volume on the sides create balance.",
};

// Barbershops in the marketplace
export const barbershops: Barbershop[] = [
  {
    id: 1,
    name: "Marcus & Co. Barbers",
    location: "Downtown Manhattan",
    distance: "2.5 km",
    rating: 4.9,
    reviewCount: 342,
    priceRange: "$$",
    description: "Premium barbershop specializing in classic cuts and modern styles. Our experienced team delivers exceptional grooming services in a sophisticated atmosphere.",
    address: "123 Broadway, New York, NY 10001",
    phone: "(555) 123-4567",
    email: "info@marcusandco.com",
    hours: {
      "Mon - Fri": "9:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "10:00 AM - 4:00 PM",
    },
    coverImage: "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    gallery: [],
    specialties: ["Classic", "Professional", "Fade"],
  },
  {
    id: 2,
    name: "The Cutting Room",
    location: "East Village",
    distance: "3.1 km",
    rating: 4.7,
    reviewCount: 218,
    priceRange: "$$$",
    description: "Upscale barbershop offering precision cuts, hot towel shaves, and premium grooming services. Modern techniques meet traditional craftsmanship.",
    address: "456 Avenue A, New York, NY 10009",
    phone: "(555) 234-5678",
    email: "hello@cuttingroom.com",
    hours: {
      "Mon - Fri": "10:00 AM - 9:00 PM",
      "Saturday": "9:00 AM - 7:00 PM",
      "Sunday": "11:00 AM - 5:00 PM",
    },
    coverImage: "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    gallery: [],
    specialties: ["Formal", "Sleek", "Classic"],
  },
  {
    id: 3,
    name: "Vintage Blades",
    location: "West End",
    distance: "1.8 km",
    rating: 4.8,
    reviewCount: 287,
    priceRange: "$$",
    description: "Traditional barbershop with a vintage aesthetic. We specialize in straight razor shaves, beard grooming, and timeless haircuts.",
    address: "789 West Street, New York, NY 10014",
    phone: "(555) 345-6789",
    email: "contact@vintageblades.com",
    hours: {
      "Mon - Fri": "8:00 AM - 7:00 PM",
      "Saturday": "8:00 AM - 6:00 PM",
      "Sunday": "Closed",
    },
    coverImage: "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    gallery: [],
    specialties: ["Classic", "Timeless", "Traditional"],
  },
  {
    id: 4,
    name: "Urban Cuts Studio",
    location: "Midtown",
    distance: "4.2 km",
    rating: 4.6,
    reviewCount: 195,
    priceRange: "$",
    description: "Contemporary barbershop focused on modern styles and urban aesthetics. Fast, efficient service without compromising quality.",
    address: "321 5th Avenue, New York, NY 10016",
    phone: "(555) 456-7890",
    email: "info@urbancuts.com",
    hours: {
      "Mon - Fri": "9:00 AM - 8:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "10:00 AM - 4:00 PM",
    },
    coverImage: "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    gallery: [],
    specialties: ["Modern", "Textured", "Trendy"],
  },
  {
    id: 5,
    name: "Gentlemen's Lounge",
    location: "Upper West Side",
    distance: "5.0 km",
    rating: 4.9,
    reviewCount: 412,
    priceRange: "$$$",
    description: "Luxury grooming experience with a focus on personalized service. Complimentary drinks, massage chairs, and premium products.",
    address: "654 Columbus Ave, New York, NY 10024",
    phone: "(555) 567-8901",
    email: "concierge@gentlemenslounge.com",
    hours: {
      "Mon - Fri": "10:00 AM - 9:00 PM",
      "Saturday": "9:00 AM - 8:00 PM",
      "Sunday": "11:00 AM - 6:00 PM",
    },
    coverImage: "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    gallery: [],
    specialties: ["Professional", "Formal", "Classic"],
  },
  {
    id: 6,
    name: "Brooklyn Fade House",
    location: "Williamsburg, Brooklyn",
    distance: "6.3 km",
    rating: 4.8,
    reviewCount: 298,
    priceRange: "$$",
    description: "Brooklyn's premier destination for precision fades, line work, and creative styles. Walk-ins welcome.",
    address: "987 Bedford Ave, Brooklyn, NY 11211",
    phone: "(555) 678-9012",
    email: "book@brooklynfade.com",
    hours: {
      "Mon - Fri": "9:00 AM - 8:00 PM",
      "Saturday": "8:00 AM - 7:00 PM",
      "Sunday": "10:00 AM - 5:00 PM",
    },
    coverImage: "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    gallery: [],
    specialties: ["Fade", "Bold", "Sharp"],
  },
];

// Services belong to specific barbershops
export const services: Service[] = [
  // Marcus & Co. Barbers (ID: 1)
  {
    id: 1,
    barbershopId: 1,
    name: "Classic Cut",
    price: "$45",
    duration: "45 min",
    description: "Traditional scissor cut tailored to your style preferences.",
  },
  {
    id: 2,
    barbershopId: 1,
    name: "Signature Cut & Style",
    price: "$65",
    duration: "60 min",
    description: "Complete haircut with wash, style, and finishing products.",
  },
  {
    id: 3,
    barbershopId: 1,
    name: "Beard Trim & Shape",
    price: "$35",
    duration: "30 min",
    description: "Expert beard grooming with hot towel treatment.",
  },
  {
    id: 4,
    barbershopId: 1,
    name: "The Full Experience",
    price: "$95",
    duration: "90 min",
    description: "Premium package with cut, style, beard trim, and massage.",
  },
  {
    id: 5,
    barbershopId: 1,
    name: "Kids Cut",
    price: "$30",
    duration: "30 min",
    description: "Patient haircut service for children under 12.",
  },

  // The Cutting Room (ID: 2)
  {
    id: 6,
    barbershopId: 2,
    name: "Precision Cut",
    price: "$55",
    duration: "50 min",
    description: "Modern precision cutting techniques for sharp styles.",
  },
  {
    id: 7,
    barbershopId: 2,
    name: "Executive Package",
    price: "$120",
    duration: "90 min",
    description: "Complete grooming with cut, shave, facial, and massage.",
  },
  {
    id: 8,
    barbershopId: 2,
    name: "Hot Towel Shave",
    price: "$50",
    duration: "45 min",
    description: "Traditional straight razor shave with hot towels.",
  },
  {
    id: 9,
    barbershopId: 2,
    name: "Beard Design",
    price: "$40",
    duration: "35 min",
    description: "Artistic beard shaping and design service.",
  },

  // Vintage Blades (ID: 3)
  {
    id: 10,
    barbershopId: 3,
    name: "Traditional Cut",
    price: "$40",
    duration: "40 min",
    description: "Classic barbering with vintage techniques.",
  },
  {
    id: 11,
    barbershopId: 3,
    name: "Straight Razor Shave",
    price: "$45",
    duration: "40 min",
    description: "Authentic straight razor shave experience.",
  },
  {
    id: 12,
    barbershopId: 3,
    name: "Beard & Mustache Grooming",
    price: "$38",
    duration: "35 min",
    description: "Detailed facial hair grooming and styling.",
  },

  // Urban Cuts Studio (ID: 4)
  {
    id: 13,
    barbershopId: 4,
    name: "Quick Cut",
    price: "$35",
    duration: "30 min",
    description: "Fast, quality haircut for busy lifestyles.",
  },
  {
    id: 14,
    barbershopId: 4,
    name: "Fade & Line Up",
    price: "$45",
    duration: "40 min",
    description: "Sharp fades with precision line work.",
  },
  {
    id: 15,
    barbershopId: 4,
    name: "Buzz Cut",
    price: "$25",
    duration: "20 min",
    description: "Clean, efficient buzz cut service.",
  },

  // Gentlemen's Lounge (ID: 5)
  {
    id: 16,
    barbershopId: 5,
    name: "The Gentleman's Cut",
    price: "$75",
    duration: "60 min",
    description: "Luxury haircut with consultation and styling.",
  },
  {
    id: 17,
    barbershopId: 5,
    name: "Royal Shave",
    price: "$85",
    duration: "60 min",
    description: "Premium hot towel shave with aromatherapy.",
  },
  {
    id: 18,
    barbershopId: 5,
    name: "The Complete Gentleman",
    price: "$150",
    duration: "120 min",
    description: "Full grooming experience with all services included.",
  },

  // Brooklyn Fade House (ID: 6)
  {
    id: 19,
    barbershopId: 6,
    name: "Signature Fade",
    price: "$50",
    duration: "45 min",
    description: "Precision fade with expert blending.",
  },
  {
    id: 20,
    barbershopId: 6,
    name: "Creative Design Cut",
    price: "$60",
    duration: "60 min",
    description: "Custom haircuts with artistic designs.",
  },
  {
    id: 21,
    barbershopId: 6,
    name: "Edge Up Special",
    price: "$30",
    duration: "25 min",
    description: "Clean line work and edge up service.",
  },
];

// Barbers belong to specific barbershops
export const barbers: Barber[] = [
  // Marcus & Co. Barbers (ID: 1)
  {
    id: 1,
    barbershopId: 1,
    name: "Marcus Johnson",
    title: "Master Barber",
    experience: "12 years",
    rating: 4.9,
    specialties: ["Classic Cuts", "Beard Sculpting", "Fades"],
    bio: "Marcus brings over a decade of expertise in traditional and modern barbering techniques.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    barbershopId: 1,
    name: "David Chen",
    title: "Senior Barber",
    experience: "8 years",
    rating: 4.8,
    specialties: ["Modern Styles", "Texturing", "Color"],
    bio: "David specializes in contemporary styles and cutting-edge techniques.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },

  // The Cutting Room (ID: 2)
  {
    id: 3,
    barbershopId: 2,
    name: "James Rodriguez",
    title: "Master Barber",
    experience: "15 years",
    rating: 5.0,
    specialties: ["Traditional Shaves", "Beard Design", "Consultation"],
    bio: "James is renowned for his precision with straight razor shaves.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4,
    barbershopId: 2,
    name: "Alex Turner",
    title: "Senior Barber",
    experience: "9 years",
    rating: 4.7,
    specialties: ["Precision Cuts", "Styling", "Consultations"],
    bio: "Alex delivers exceptional service with attention to detail.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },

  // Vintage Blades (ID: 3)
  {
    id: 5,
    barbershopId: 3,
    name: "Ryan Cooper",
    title: "Master Barber",
    experience: "10 years",
    rating: 4.9,
    specialties: ["Straight Razors", "Traditional Cuts", "Beard Work"],
    bio: "Ryan's expertise in traditional barbering is unmatched.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },

  // Urban Cuts Studio (ID: 4)
  {
    id: 6,
    barbershopId: 4,
    name: "Ethan Brooks",
    title: "Barber",
    experience: "6 years",
    rating: 4.8,
    specialties: ["Fades", "Line Work", "Modern Styles"],
    bio: "Ethan specializes in urban styles and quick, quality service.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },

  // Gentlemen's Lounge (ID: 5)
  {
    id: 7,
    barbershopId: 5,
    name: "Sebastian Grant",
    title: "Master Stylist",
    experience: "14 years",
    rating: 5.0,
    specialties: ["Luxury Service", "Styling", "Consultations"],
    bio: "Sebastian provides world-class grooming experiences.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },

  // Brooklyn Fade House (ID: 6)
  {
    id: 8,
    barbershopId: 6,
    name: "Miguel Santos",
    title: "Fade Specialist",
    experience: "7 years",
    rating: 4.9,
    specialties: ["Precision Fades", "Edge Ups", "Creative Designs"],
    bio: "Miguel's fade game is on another level.",
    image: "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

// Mock bookings for My Bookings page
export const mockBookings: Booking[] = [
  {
    id: 1,
    barbershopId: 1,
    barbershopName: "Marcus & Co. Barbers",
    barbershopLocation: "Downtown Manhattan",
    service: "Signature Cut & Style",
    barber: "Marcus Johnson",
    date: "March 25, 2026",
    time: "2:00 PM",
    price: "$65",
    status: "upcoming",
  },
  {
    id: 2,
    barbershopId: 3,
    barbershopName: "Vintage Blades",
    barbershopLocation: "West End",
    service: "Straight Razor Shave",
    barber: "Ryan Cooper",
    date: "March 15, 2026",
    time: "10:30 AM",
    price: "$45",
    status: "completed",
  },
  {
    id: 3,
    barbershopId: 2,
    barbershopName: "The Cutting Room",
    barbershopLocation: "East Village",
    service: "Hot Towel Shave",
    barber: "James Rodriguez",
    date: "March 8, 2026",
    time: "4:00 PM",
    price: "$50",
    status: "completed",
  },
];

// Helper functions
export const getBarbershopById = (id: number): Barbershop | undefined => {
  return barbershops.find((b) => b.id === id);
};

export const getServicesByBarbershopId = (barbershopId: number): Service[] => {
  return services.filter((s) => s.barbershopId === barbershopId);
};

export const getBarbersByBarbershopId = (barbershopId: number): Barber[] => {
  return barbers.filter((b) => b.barbershopId === barbershopId);
};