export type School = {
  id: string;
  name: string;
  slug: string;
  affiliateUrl: string;
  affiliateNetwork: "cj" | "impact" | "shareasale" | "direct";
  price: number;
  originalPrice?: number;
  completionTimeHours: number;
  states: string[];
  rating: number;
  reviewCount: number;
  features: string[];
  pros: string[];
  cons: string[];
  courtAcceptance: "all" | "most" | "some";
  mobileApp: boolean;
  moneyBackGuarantee: boolean;
  certificateDelivery: "electronic" | "mail" | "both";
  founded: number;
  badge?: "best-value" | "fastest" | "top-rated" | "editors-choice";
  description: string;
  longDescription: string;
};

export type StudentReview = {
  name: string;
  state: string;
  rating: number;
  date: string;
  text: string;
  schoolSlug: string;
};

const ALL_STATES = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada","new-hampshire",
  "new-jersey","new-mexico","new-york","north-carolina","north-dakota","ohio",
  "oklahoma","oregon","pennsylvania","rhode-island","south-carolina","south-dakota",
  "tennessee","texas","utah","vermont","virginia","washington","west-virginia",
  "wisconsin","wyoming",
];

const MAJOR_STATES = [
  "california","texas","florida","new-york","illinois","pennsylvania","ohio",
  "georgia","north-carolina","michigan","new-jersey","virginia","washington",
  "arizona","massachusetts","tennessee","indiana","maryland","missouri","wisconsin",
  "colorado","minnesota","south-carolina","alabama","louisiana","kentucky","oregon",
  "oklahoma","connecticut","utah","iowa","nevada","arkansas","mississippi","kansas",
];

export const schools: School[] = [
  {
    id: "idrivesafely",
    name: "iDriveSafely",
    slug: "idrivesafely",
    affiliateUrl: "https://www.idrivesafely.com",
    affiliateNetwork: "cj",
    price: 19.95,
    originalPrice: 34.95,
    completionTimeHours: 6,
    states: ALL_STATES,
    rating: 4.6,
    reviewCount: 12847,
    features: [
      "100% online course",
      "Court-approved in all states",
      "Mobile-friendly",
      "Completion certificate included",
      "24/7 customer support",
      "Free certificate shipping",
    ],
    pros: [
      "Lowest price among major providers",
      "Available in all 50 states",
      "Simple, easy-to-follow format",
      "Money-back guarantee",
      "24/7 phone and chat support",
    ],
    cons: [
      "Course content can feel dated",
      "No dedicated mobile app",
      "Some states require longer completion times",
    ],
    courtAcceptance: "all",
    mobileApp: false,
    moneyBackGuarantee: true,
    certificateDelivery: "both",
    founded: 1998,
    badge: "best-value",
    description:
      "iDriveSafely is one of the most affordable and widely accepted online traffic schools in the US, offering court-approved courses in all 50 states.",
    longDescription:
      "Founded in 1998, iDriveSafely has helped over 5 million drivers dismiss tickets and reduce points on their driving records. Their courses are approved by state DMVs and accepted by courts nationwide. The platform offers a straightforward, no-frills experience focused on getting you through the material efficiently while meeting all state requirements. With competitive pricing and frequent discount offers, iDriveSafely consistently ranks as one of the best value options for online traffic school.",
  },
  {
    id: "aceable",
    name: "Aceable",
    slug: "aceable",
    affiliateUrl: "https://www.aceable.com",
    affiliateNetwork: "impact",
    price: 24.99,
    originalPrice: 44.99,
    completionTimeHours: 5,
    states: MAJOR_STATES,
    rating: 4.8,
    reviewCount: 18432,
    features: [
      "Award-winning mobile app",
      "Video-based lessons",
      "Interactive quizzes",
      "Progress saved across devices",
      "Animated content",
      "Live customer support",
    ],
    pros: [
      "Best-in-class mobile app experience",
      "Engaging video content keeps you interested",
      "Fastest completion time (5 hours)",
      "Modern, intuitive interface",
      "Excellent customer reviews",
    ],
    cons: [
      "Slightly higher price point",
      "Not available in all 50 states",
      "Some features require app download",
    ],
    courtAcceptance: "most",
    mobileApp: true,
    moneyBackGuarantee: true,
    certificateDelivery: "electronic",
    founded: 2014,
    badge: "top-rated",
    description:
      "Aceable offers the highest-rated online traffic school experience with an award-winning mobile app and engaging video-based content.",
    longDescription:
      "Aceable has revolutionized online traffic school with its mobile-first approach and engaging content. Founded in 2014, the Austin-based company has won multiple awards for its educational technology. Their traffic school course features professional video content, interactive animations, and a seamless mobile app that lets you complete your course anywhere. While slightly more expensive than competitors, the superior user experience and faster completion time make Aceable a top choice for drivers who value quality and convenience.",
  },
  {
    id: "ticketschool",
    name: "TicketSchool",
    slug: "ticketschool",
    affiliateUrl: "https://www.ticketschool.com",
    affiliateNetwork: "shareasale",
    price: 19.95,
    originalPrice: 29.95,
    completionTimeHours: 6,
    states: ["florida", "texas", "california"],
    rating: 4.5,
    reviewCount: 8921,
    features: [
      "State-specific content",
      "Unlimited retakes",
      "Electronic certificate delivery",
      "Audio read-along option",
      "Progress tracking",
      "Bilingual courses available",
    ],
    pros: [
      "Deeply focused on FL, TX, and CA requirements",
      "Great price with frequent promotions",
      "Unlimited quiz retakes at no extra cost",
      "Spanish language option available",
      "Fast electronic certificate delivery",
    ],
    cons: [
      "Only available in 3 states",
      "No mobile app",
      "Course interface feels basic",
    ],
    courtAcceptance: "all",
    mobileApp: false,
    moneyBackGuarantee: true,
    certificateDelivery: "electronic",
    founded: 2005,
    badge: "best-value",
    description:
      "TicketSchool specializes in court-approved traffic school for Florida, Texas, and California with competitive pricing and unlimited retakes.",
    longDescription:
      "TicketSchool has built a strong reputation in Florida, Texas, and California by focusing exclusively on these three high-volume states. This specialization means their course content is deeply tailored to each state's specific requirements and court expectations. With unlimited quiz retakes, bilingual course options, and fast electronic certificate delivery, TicketSchool is an excellent choice for drivers in their covered states who want a reliable, affordable option.",
  },
  {
    id: "improv-traffic-school",
    name: "Improv Traffic School",
    slug: "improv-traffic-school",
    affiliateUrl: "https://www.improvtrafficschool.com",
    affiliateNetwork: "direct",
    price: 22.95,
    originalPrice: 34.95,
    completionTimeHours: 6,
    states: ["california", "florida", "texas", "new-york", "arizona", "nevada", "colorado", "georgia", "virginia", "new-jersey"],
    rating: 4.4,
    reviewCount: 6543,
    features: [
      "Comedy-based course content",
      "Videos and animations",
      "Mobile-optimized website",
      "Same-day certificate processing",
      "DMV-approved",
      "Free retakes",
    ],
    pros: [
      "Entertaining comedy-style content",
      "Makes a boring course actually fun",
      "Same-day certificate processing",
      "Good selection of states covered",
      "Competitive mid-range pricing",
    ],
    cons: [
      "Comedy style isn't for everyone",
      "Not available in all states",
      "No dedicated mobile app",
      "Slightly higher than cheapest options",
    ],
    courtAcceptance: "most",
    mobileApp: false,
    moneyBackGuarantee: true,
    certificateDelivery: "both",
    founded: 2001,
    description:
      "Improv Traffic School makes traffic school entertaining with comedy-based course content, available in major states with same-day certificate processing.",
    longDescription:
      "If the thought of sitting through hours of traffic school content makes you cringe, Improv Traffic School might be the solution. Founded by comedy writers, this unique approach to driver education uses humor, funny videos, and entertaining scenarios to teach safe driving concepts. The course is DMV-approved and court-accepted in multiple states. While the comedy style may not appeal to everyone, most students report that it makes the required hours go by much faster than traditional text-based courses.",
  },
  {
    id: "driversed",
    name: "DriversEd.com",
    slug: "driversed",
    affiliateUrl: "https://www.driversed.com",
    affiliateNetwork: "cj",
    price: 29.99,
    originalPrice: 49.99,
    completionTimeHours: 8,
    states: ALL_STATES,
    rating: 4.3,
    reviewCount: 15678,
    features: [
      "Comprehensive course content",
      "3D animations and simulations",
      "Mobile app available",
      "Instructor support",
      "Certificate tracking dashboard",
      "Insurance discount eligible",
    ],
    pros: [
      "Most comprehensive course content available",
      "Available in all 50 states",
      "3D driving simulations enhance learning",
      "Established brand with long track record",
      "May qualify you for insurance discounts",
    ],
    cons: [
      "Most expensive option",
      "Longest completion time (8 hours)",
      "Course can feel overly detailed",
      "Mobile app has mixed reviews",
    ],
    courtAcceptance: "all",
    mobileApp: true,
    moneyBackGuarantee: true,
    certificateDelivery: "both",
    founded: 1997,
    badge: "editors-choice",
    description:
      "DriversEd.com offers the most comprehensive online traffic school with 3D simulations, available in all 50 states with a strong focus on education.",
    longDescription:
      "As one of the oldest names in online driver education, DriversEd.com brings decades of experience to their traffic school courses. Their comprehensive approach includes 3D driving simulations, detailed animations, and thorough coverage of safe driving practices. While the course takes longer and costs more than competitors, the depth of content is unmatched. DriversEd.com is ideal for drivers who want to genuinely improve their driving knowledge, not just check a box. Their courses are accepted by courts and DMVs in all 50 states.",
  },
];

export const studentReviews: StudentReview[] = [
  // iDriveSafely
  { name: "Sarah M.", state: "California", rating: 5, date: "2025-03-15", text: "Super easy and affordable. I finished the whole course in one afternoon. Got my certificate the next day and my ticket was dismissed!", schoolSlug: "idrivesafely" },
  { name: "James T.", state: "Texas", rating: 4, date: "2025-02-28", text: "Straightforward course at a great price. The content isn't exciting but it gets the job done. Certificate arrived quickly.", schoolSlug: "idrivesafely" },
  { name: "Maria G.", state: "Florida", rating: 5, date: "2025-03-01", text: "Best price I found anywhere. The course was simple and the customer support helped me when I had a question about my certificate.", schoolSlug: "idrivesafely" },
  { name: "Robert K.", state: "New York", rating: 4, date: "2025-01-20", text: "Good value for the money. I appreciated that I could save my progress and come back later. Would recommend.", schoolSlug: "idrivesafely" },
  { name: "Ashley P.", state: "Ohio", rating: 5, date: "2025-03-10", text: "I was dreading traffic school but this made it painless. Done in about 6 hours spread over two days. Ticket dismissed!", schoolSlug: "idrivesafely" },
  // Aceable
  { name: "David L.", state: "California", rating: 5, date: "2025-03-12", text: "The app is amazing. I did the whole course on my phone during lunch breaks. Videos were actually interesting and I learned things.", schoolSlug: "aceable" },
  { name: "Jennifer W.", state: "Texas", rating: 5, date: "2025-02-15", text: "Worth every penny. The video lessons are so much better than reading walls of text. Finished in under 5 hours.", schoolSlug: "aceable" },
  { name: "Michael R.", state: "Florida", rating: 4, date: "2025-03-05", text: "Great mobile experience and engaging content. A bit pricier than others but the quality difference is noticeable.", schoolSlug: "aceable" },
  { name: "Emily S.", state: "Georgia", rating: 5, date: "2025-01-30", text: "Best online traffic school I could have picked. The animations and videos made it feel less like a punishment and more like actual learning.", schoolSlug: "aceable" },
  { name: "Chris H.", state: "Arizona", rating: 5, date: "2025-02-22", text: "Downloaded the app and knocked out the course over a weekend. Super smooth experience from start to certificate.", schoolSlug: "aceable" },
  // TicketSchool
  { name: "Ana R.", state: "Florida", rating: 5, date: "2025-03-08", text: "Being able to take the course in Spanish was huge for my mom. The Florida-specific content was very relevant.", schoolSlug: "ticketschool" },
  { name: "Tom B.", state: "Texas", rating: 4, date: "2025-02-10", text: "Simple and effective. I liked that I could retake quizzes without paying extra. Got my certificate electronically same day.", schoolSlug: "ticketschool" },
  { name: "Lisa M.", state: "California", rating: 4, date: "2025-01-25", text: "Good price and the course was focused on California laws which helped. Interface is a bit dated but functional.", schoolSlug: "ticketschool" },
  { name: "Carlos D.", state: "Florida", rating: 5, date: "2025-03-18", text: "Third time using TicketSchool (I know, I know). Always reliable, always accepted by the court. Fast certificate delivery.", schoolSlug: "ticketschool" },
  { name: "Rachel N.", state: "Texas", rating: 4, date: "2025-02-05", text: "Affordable and straightforward. The audio read-along feature was nice when I got tired of reading. Texas content was accurate.", schoolSlug: "ticketschool" },
  // Improv Traffic School
  { name: "Kevin W.", state: "California", rating: 5, date: "2025-03-14", text: "Actually laughed out loud during a traffic school course. Never thought I'd say that. Made the 6 hours fly by.", schoolSlug: "improv-traffic-school" },
  { name: "Stephanie F.", state: "Florida", rating: 4, date: "2025-02-20", text: "The comedy approach is fun but some jokes fell flat. Still way better than a boring text course. Got my certificate quickly.", schoolSlug: "improv-traffic-school" },
  { name: "Brian J.", state: "Texas", rating: 4, date: "2025-01-15", text: "If you have to do traffic school, might as well have some laughs. The videos were entertaining and the price was fair.", schoolSlug: "improv-traffic-school" },
  { name: "Nicole A.", state: "Arizona", rating: 5, date: "2025-03-02", text: "My husband and I both had tickets and we did the course together. We were actually entertained. Same-day certificate was a bonus.", schoolSlug: "improv-traffic-school" },
  { name: "Daniel P.", state: "Nevada", rating: 3, date: "2025-02-18", text: "The comedy thing isn't really my style but the course content was solid and my ticket was dismissed. That's what matters.", schoolSlug: "improv-traffic-school" },
  // DriversEd.com
  { name: "Patricia H.", state: "California", rating: 4, date: "2025-03-11", text: "Very thorough course. The 3D simulations were cool and I actually felt like a better driver after. Just wish it was shorter.", schoolSlug: "driversed" },
  { name: "Steven C.", state: "Illinois", rating: 4, date: "2025-02-25", text: "Most detailed traffic school I've seen. Great for learning but 8 hours is a lot. The mobile app could use some work.", schoolSlug: "driversed" },
  { name: "Amanda Y.", state: "Texas", rating: 5, date: "2025-01-28", text: "I chose DriversEd.com because I wanted to actually learn from the experience, not just rush through. Well worth the extra cost.", schoolSlug: "driversed" },
  { name: "Mark T.", state: "Pennsylvania", rating: 3, date: "2025-03-06", text: "Content is good but it's the most expensive option and takes the longest. If you just need to dismiss a ticket, there are cheaper options.", schoolSlug: "driversed" },
  { name: "Susan L.", state: "Washington", rating: 4, date: "2025-02-12", text: "The insurance discount more than made up for the higher price. Course was comprehensive and I got my certificate without issues.", schoolSlug: "driversed" },
];

export function getSchoolBySlug(slug: string): School | undefined {
  return schools.find((s) => s.slug === slug);
}

export function getSchoolsForState(stateSlug: string): School[] {
  return schools.filter((s) => s.states.includes(stateSlug));
}

export function getReviewsForSchool(slug: string): StudentReview[] {
  return studentReviews.filter((r) => r.schoolSlug === slug);
}

export function getTopSchools(count: number = 3): School[] {
  return [...schools].sort((a, b) => b.rating - a.rating).slice(0, count);
}
