import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  subregion: text("subregion").default(""),
  region: text("region").notNull().default("NA"),
  bio: text("bio").default(""),
  profilePicture: text("profile_picture"),
  bannerPicture: text("banner_picture"),
  connectionGoal: text("connection_goal").notNull(),
  age: integer("age").notNull(),
  is18Plus: boolean("is_18_plus").notNull().default(true),
  hasAgreedToRules: boolean("has_agreed_to_rules").notNull().default(false),
  isShadowBanned: boolean("is_shadow_banned").notNull().default(false),
  firstMessageFilterEnabled: boolean("first_message_filter_enabled").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Match questions
  seekingType: text("seeking_type"),
  gamesPlaying: text("games_playing"),
  idealFirstDate: text("ideal_first_date"),
  catOrDog: text("cat_or_dog"),
  gamingPlatform: text("gaming_platform"),
  relationshipType: text("relationship_type"),
  drinking: text("drinking"),
  smoking: text("smoking"),
  phonePreference: text("phone_preference"),
  cokeOrPepsi: text("coke_or_pepsi"),
  inputPreference: text("input_preference"),
  meetingPreference: text("meeting_preference"),
  aboutMe: text("about_me"),
  
  // Age verification
  ageVerificationStatus: text("age_verification_status").default("pending"),
  ageVerificationPhoto: text("age_verification_photo"),
  ageVerificationSubmittedAt: timestamp("age_verification_submitted_at"),
  
  // Email preferences
  emailOnMessage: boolean("email_on_message").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  is18Plus: true,
  isShadowBanned: true,
  isVerified: true,
  isAdmin: true,
  createdAt: true,
  ageVerificationStatus: true,
  ageVerificationPhoto: true,
  ageVerificationSubmittedAt: true,
  emailOnMessage: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  age: z.number().min(18, "You must be at least 18 years old"),
  subregion: z.string().optional().default(""),
  hasAgreedToRules: z.boolean().refine(val => val === true, "You must agree to the respect check"),
  connectionGoal: z.string().min(10, "Please describe your connection goal (at least 10 chars)"),
  seekingType: z.string().optional(),
  gamesPlaying: z.string().optional(),
  idealFirstDate: z.string().optional(),
  catOrDog: z.string().optional(),
  gamingPlatform: z.string().optional(),
  relationshipType: z.string().optional(),
  drinking: z.string().optional(),
  smoking: z.string().optional(),
  phonePreference: z.string().optional(),
  cokeOrPepsi: z.string().optional(),
  inputPreference: z.string().optional(),
  meetingPreference: z.string().optional(),
  aboutMe: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  hashedToken: text("hashed_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const profilePictures = pgTable("profile_pictures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  objectPath: text("object_path").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfilePictureSchema = createInsertSchema(profilePictures).omit({
  id: true,
  createdAt: true,
});

export type ProfilePicture = typeof profilePictures.$inferSelect;
export type InsertProfilePicture = z.infer<typeof insertProfilePictureSchema>;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  reportedUserId: integer("reported_user_id").references(() => users.id),
  reportedMessageId: integer("reported_message_id").references(() => messages.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  status: true,
  adminNotes: true,
  resolvedAt: true,
  resolvedBy: true,
  createdAt: true,
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export const statusUpdates = pgTable("status_updates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStatusUpdateSchema = createInsertSchema(statusUpdates).omit({
  id: true,
  createdAt: true,
});

export type StatusUpdate = typeof statusUpdates.$inferSelect;
export type InsertStatusUpdate = z.infer<typeof insertStatusUpdateSchema>;

export const REPORT_REASONS = [
  "Harassment",
  "Inappropriate Content",
  "Fake Profile",
  "Spam",
  "Underage User",
  "Threatening Behavior",
  "Other",
] as const;

export const SEEKING_TYPES = [
  "Femboy seeking Femboy",
  "Femboy seeking Male",
  "Femboy seeking Female",
  "Femboy seeking Anyone",
  "Male seeking Femboy",
  "Female seeking Femboy",
] as const;

export const RELATIONSHIP_TYPES = [
  "Long Term",
  "Friends with Benefits",
  "Hookups",
  "Just Friends",
  "Open to Anything",
] as const;

export const GAMING_PLATFORMS = [
  "Xbox",
  "PlayStation",
  "PC",
  "Nintendo Switch",
  "Mobile",
  "Multiple Platforms",
  "Don't Game",
] as const;

export const INPUT_PREFERENCES = [
  "Mouse and Keyboard",
  "Controller",
  "Both",
  "N/A",
] as const;

export const MEETING_PREFERENCES = [
  "Online Only",
  "IRL Only",
  "Both Online and IRL",
] as const;

export const ROLES = [
  "Femboy",
  "Male",
  "Female",
  "Non-Binary",
] as const;

export const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Asia",
  "Africa",
  "Australia",
] as const;

export const LOCATIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Australia",
  "Japan",
  "South Korea",
  "Sweden",
  "Cambodia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "China",
  "Russia",
  "Turkey",
  "Netherlands",
  "Belgium",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Greece",
  "Portugal",
  "Poland",
  "Czech Republic",
  "Hungary",
  "South Africa",
  `Nigeria`,
  "Kenya",
  "Egypt",
  "Morocco",
  "Saudi Arabia",
  "United Arab Emirates",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "New Zealand",
  "Israel",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Bhutan",
  "Maldives",
  "Mexico",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Costa Rica",
  "Panama",
  "Cuba",
  "Dominican Republic",
  "Haiti",
  "Jamaica",
  "Trinidad and Tobago",
  "Barbados",
  "Bahamas",
  "Puerto Rico",
  "Curaçao",
  "Brazil",
  `Argentina`,
  "Chile",
  "Colombia",
  "Peru",
  "Venezuela",
  "Ecuador",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Costa Rica",
  "Panama",
  "Brazil",
  "Mexico",
  "India",
  "Other"
] as const;

export const SUBREGIONS: Record<string, string[]> = {
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland"
  ],
  "Australia": [
    "New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia", "Australian Capital Territory", "Northern Territory"
  ],
  "Austria": ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg",
  ],
  "Germany": ["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
 ],
  "France": ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire", "Corse", "Grand Est", "Hauts-de-France", "Île-de-France",
 ],
  "Italy": ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lomb", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria",
 ],
  "Spain": ["Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias", "Cantabria", "Castilla y León", "Castilla-La Mancha", "Cataluña",
  ],
  "Sweden": ["Blekinge", "Dalarna", "Gävleborg", "Gotland", "Halland", "Jämtland", "Jönköping", "Kalmar", "Kronoberg", "Norrbotten", "Örebro", "Östergötland", "Skåne", "Södermanland", "Stockholm", "Uppsala", "Värmland", "Västerbotten", "Västernorrland", "Västmanland",
  ],
  "Norway": ["Akershus", "Aust-Agder", "Buskerud", "Finnmark", "Hedmark", "Hordaland", "Møre og Romsdal", "Nordland", "Nord-Trøndelag", "Oppland", "Oslo", "Rogaland", "Sogn og Fjordane", "Sør-Trøndelag", "Telemark", "Troms",
  ],
  "Denmark": ["Hovedstaden", "Midtjylland", "Nordjylland", "Sjælland", "Syddanmark",
  ],
  "Finland": ["Åland", "Etelä-Karjala", "Etelä-Pohjanmaa", "Etelä-Savo", "Kainuu", "Kanta-Häme", "Keski-Pohjanmaa", "Keski-Suomi", "Kymenlaakso", "Lappi", "Päijät-Häme", "Pirkanmaa", "Pohjanmaa", "Pohjois-Karjala",
  ],
   "Switzerland": ["Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", "Basel-Stadt", "Bern", "Fribourg", "Genève", "Glarus", "Graubünden", "Jura", "Luzern", "Neuchâtel", "Nidwalden", "Obwalden", "Sankt Gallen", "Schaffhausen",
  ],
   "Netherlands": ["Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland",
  ],
  "Belgium": ["Antwerpen", "Brussels", "Flanders", "Wallonia",
  ],
  "Portugal": ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisbon", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu",
 ],
   "Poland": ["Dolnośląskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie", "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie", "Świętokrzyskie",
],
   "Czech Republic": ["Hlavní město Praha", "Jihočeský kraj", "Jihomoravský kraj", "Karlovarský kraj", "Kraj Vysočina", "Královéhradecký kraj", "Liberecký kraj", "Moravskoslezský kraj", "Olomoucký kraj", "Pardubický kraj", "Plzeňský kraj", "Středočeský kraj",
],
  "Hungary": ["Bács-Kiskun", "Baranya", "Békés", "Borsod-Abaúj-Zemplén", "Csongrád-Csanád", "Fejér", "Győr-Moson-Sopron", "Hajdú-Bihar", "Heves", "Jász-Nagykun-Szolnok", "Komárom-Esztergom", "Nógrád",
],
   "South Africa": ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape",
],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Perm", "Voronezh", "Volgograd",
],
   "Turkey": ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis",
],
  "Isreal": ["Central District", "Haifa District", "Jerusalem District", "Northern District", "Southern District", "Tel Aviv District", "Judea and Samaria Area",
],
   "India": ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
],
   "Pakistan": ["Azad Kashmir", "Balochistan", "Federally Administered Tribal Areas", "Gilgit-Baltistan", "Islamabad Capital Territory", "Khyber Pakhtunkhwa", "Punjab", "Sindh",
],
  "Bangladesh": ["Barisal", "Chittagong", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet",
],
  "Sri Lanka": ["Central Province", "Eastern Province", "North Central Province", "Northern Province", "North Western Province", "Sabaragamuwa Province", "Southern Province", "Uva Province", "Western Province",
],
   "Nepal": ["Bagmati", "Bheri", "Dhawalagiri", "Gandaki", "Janakpur", "Karnali", "Kosi", "Lumbini", "Mahakali", "Mechi", "Narayani", "Rapti", "Sagarmatha",
],
  "Japan": ["Hokkaido", "Tohoku", "Kanto", "Chubu", "Kansai", "Chugoku", "Shikoku", "Kyushu", "Okinawa", "Honshu", "Shikoku", "Kyushu", "Hiroshima", "Okayama", "Shimane", "Tottori", "Yamaguchi", "Fukuoka", "Kagoshima", "Kumamoto", "Miyazaki", "Nagasaki", "Oita",
],
   "South Korea": ["Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong", "Gyeonggi", "Gangwon", "Chungcheongbuk", "Chungcheongnam", "Jeollabuk", "Jeollanam", "Gyeongsangbuk", "Gyeongsangnam",
],
   "China": ["Beijing", "Tianjin", "Hebei", "Shanxi", "Inner Mongolia", "Liaoning", "Jilin", "Heilongjiang", "Shanghai", "Jiangsu", "Zhejiang", "Anhui", "Fujian", "Jiangxi", "Shandong", "Henan", "Hubei", "Hunan", "Guangdong", "Guangxi",
],
  "Taiwan": ["Taipei", "New Taipei", "Taoyuan", "Taichung", "Tainan", "Kaohsiung", "Keelung", "Hsinchu", "Miaoli", "Changhua", "Nantou", "Yunlin", "Chiayi", "Pingtung", "Yilan", "Hualien", "Taitung", "Penghu", "Kinmen",
],
   "Hong Kong": ["Hong Kong Island", "Kowloon", "New Territories", "Central and Western", "Wan Chai", "Eastern", "Southern", "Yau Tsim Mong", "Sham Shui Po", "Kowloon City", "Wong Tai Sin",
],
  "Cuba": ["Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas", "Villa Clara", "Cienfuegos", "Sancti Spíritus", "Ciego de Ávila", "Camagüey", "Las Tunas", "Granma", "Holguín", "Santiago de Cuba", "Guantánamo"
],
  "Panama": ["Bocas del Toro", "Chiriquí", "Coclé", "Colón", "Darién", "Herrera", "Los Santos", "Panamá", "Veraguas", "Panamá Oeste", "Emberá-Wounaan", "Guna Yala",
],
"Mexico": ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Mexico City", "Mexico State", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
],
"Brazil": ["Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
  ],
"Argentina": ["Buenos Aires", "Buenos Aires City", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  ],

"Chile": ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitan Region", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
  ],
"Colombia": ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
  ],
  "Peru": ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
  ],
"Venezuela": ["Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Falcón", "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "Yaracuy", "Zulia",
  ],
"Ecuador": ["Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona-Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora-Chinchipe"
 ],
  "Bolivia": ["Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro", "Pando", "Potosí", "Santa Cruz", "Tarija"
 ],
"Paraguay": ["Alto Paraguay", "Alto Paraná", "Amambay", "Boquerón", "Caaguazú", "Caazapá", "Canindeyú", "Central", "Concepción", "Cordillera", "Guairá", "Itapúa", "Misiones", "Ñeembucú", "Paraguarí", "Presidente Hayes", "San Pedro",
 ],

"Uruguay": ["Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
  ],

"Guatemala": ["Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "El Progreso", "Escuintla", "Guatemala", "Huehuetenango", "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango", "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos", "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa",
  ],

"Honduras": ["Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá", "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro",
  ],

"El Salvador": ["Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz", "La Unión", "Morazán", "San Miguel", "San Salvador", "San Vicente", "Santa Ana", "Sonsonate", "Usulután",
  ],

"Nicaragua": ["Boaco", "Carazo", "Chinandega", "Chontales", "Estelí", "Granada", "Jinotega", "León", "Madriz", "Managua", "Masaya", "Matagalpa", "Nueva Segovia", "Río San Juan", "Rivas", "North Caribbean Coast", "South Caribbean Coast",
  ],

"Costa Rica": ["Alajuela", "Cartago", "Guanacaste", "Heredia", "Limón", "Puntarenas", "San José"
  ],

"Dominican Republic": ["Azua", "Baoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte", "El Seibo", "Espaillat", "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia", "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan", "San Pedro de Macorís", "Sánchez Ramírez", "Santiago", "Santiago Rodríguez", "Santo Domingo", "Valverde",
  ],

"Haiti": ["Artibonite", "Centre", "Grand'Anse", "Nippes", "Nord", "Nord-Est", "Nord-Ouest", "Ouest", "Sud", "Sud-Est",
  ],

"Jamaica": ["Clarendon", "Hanover", "Kingston", "Manchester", "Portland", "Saint Andrew", "Saint Ann", "Saint Catherine", "Saint Elizabeth", "Saint James", "Saint Mary", "Saint Thomas", "Trelawny", "Westmoreland",
  ],

};
