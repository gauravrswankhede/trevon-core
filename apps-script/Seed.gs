/**
 * Trevon — starting data. Edit these lists BEFORE running setup(), or edit the sheets afterwards.
 * Board ids must match the repository names (trevon-<id>).
 */

// [id, name, type, people (comma), emails (comma), aliases / spellings Gemini may use, routine codes this board oversees group-wide]
const SEED_BOARDS = [
  ['ranchi',    'Trevon Ranchi',    'property', 'Santosh Kumar',  'gm.ranchi@trevonhotels.com', 'Ranchi, Raji, Vanchi, RIMS', 'R-CHECKOUT,R-QR,R-TREAT'],
  ['haldwani',  'Trevon Haldwani',  'property', 'Shravan Khan',   'cgm.north@trevonhotels.com', 'Haldwani, Haldoni, Inwani, Sharvan', 'R-CONTENT,R-TREAT'],
  ['delhi',     'Trevon Delhi (Karol Bagh)', 'property', 'Virender Kumar', 'gm.delhi@trevonhotels.com', 'Delhi, New Delhi, Karol Bagh, Trevon Inn', ''],
  ['gurugram',  'Trevon Gurugram',  'property', 'Dinesh',         'gm.ggn31@trevonhotels.com', 'Gurugram, Gurgaon, Gorgang', ''],
  ['marchula',  'Trevon Marchula',  'property', 'Sheetal Kaushik','gm.tcpe@trevonhotels.com', 'Marchula, Pine Corbett, Corbett', ''],
  ['goa',       'Trevon Goa',       'property', 'Saurabh Singh',  'rm.hydegoa@gmail.com, cgm@trevonhotels.com', 'Goa, Hyde Goa, Hyde', 'R-REVIEWS'],
  ['dhanbad',   'Trevon Dhanbad',   'property', 'Akash Lala',     'twintreeofficial@gmail.com', 'Dhanbad', ''],
  ['chakrata',  'Trevon Chakrata',  'property', 'Sandeep Rawat',  'gm.trvc@trevonhotels.com', 'Chakrata', ''],
  ['gwalior',   'Trevon Gwalior',   'property', 'Satish Gupta',   '', 'Gwalior', ''],
  ['sales',     'Sales & OTA',      'team',     'Anupam Roy, Sandeep, Kostub', 'anupamroy2006@gmail.com', 'Anupam, Kostub, OTA, MakeMyTrip, Goibibo, Booking.com, Agoda', 'R-CHANNEL,R-CRM,R-CATCHMENT,R-TARGETS,R-LONGSTAY'],
  ['marketing', 'Marketing (Gurugram)', 'team', 'Pawan, Ashutosh Singh', '', 'Pawan, Ashutosh', 'R-LONGSTAY'],
  ['corporate', 'Corporate (Directors & Finance)', 'corporate', 'Rakesh Chaturvedi, Rohit Sangwan, Gaurav Wankhede, Ramavtar', 'rakesh@trevonhotels.com', 'Rakesh, Punit Kaushik, Rohit Sangwan, Gaurav, Ramavtar, The group leadership', 'R-GMB'],
];

// [code, applies to (ALL_PROPERTIES or a board id), title, detail, Weekly/Monthly, number to record (blank = none), overseen by]
const SEED_ROUTINES = [
  // every property, every week
  ['R-CONTENT',  'ALL_PROPERTIES', 'Upload this week\'s photos & videos to Google Drive', 'Social media champion collects rooms, food, events, guests (with consent).', 'Weekly', 'Files uploaded', 'Shravan Khan'],
  ['R-GMB',      'ALL_PROPERTIES', 'Post fresh photos/videos/offers on Google Business Profile', 'At least 2 posts; property, banquet and restaurant profiles.', 'Weekly', 'GMB posts', 'Gaurav (GMB team)'],
  ['R-CHECKOUT', 'ALL_PROPERTIES', '2nd/3rd in-charge met every guest at checkout', '10-second conversation at the counter with every departing guest.', 'Weekly', '% of guests met', 'Santosh Kumar'],
  ['R-TREAT',    'ALL_PROPERTIES', 'Checkout treat + Google review request to every guest', 'Cookies / protein bar / chocolate with the review card and QR.', 'Weekly', 'Treats given', 'Santosh Kumar & Shravan Khan'],
  ['R-REVIEWS',  'ALL_PROPERTIES', 'Replied to every Google & OTA review within 48 h, in the approved format', 'Use the reply format agreed with Gaurav. Record new Google reviews this week.', 'Weekly', 'New Google reviews', 'Saurabh Singh'],
  ['R-QR',       'ALL_PROPERTIES', 'All QR codes checked: they open the correct review/booking page', 'Reception, rooms, restaurant, banquet.', 'Weekly', '', 'Santosh Kumar'],
  ['R-CHANNEL',  'ALL_PROPERTIES', 'Channel manager accurate: no rejected bookings, no idle blocked rooms', '', 'Weekly', 'Rejected bookings', 'Anupam / Sandeep'],
  ['R-CRM',      'ALL_PROPERTIES', 'Every lead, approach and outcome logged in the sales sheet', '', 'Weekly', 'Leads logged', 'Anupam / Sandeep'],
  ['R-CATCHMENT','ALL_PROPERTIES', 'Visited local companies / hospitals / offices for corporate room-nights', '', 'Weekly', 'Visits made', 'Anupam / Sandeep'],
  ['R-TARGETS',  'ALL_PROPERTIES', 'Reported room-nights & banquet numbers on the weekly sales call', '', 'Weekly', 'Room-nights this week', 'Anupam / Sandeep'],
  ['R-LONGSTAY', 'ALL_PROPERTIES', 'Long-stay listings live and refreshed (99acres, NoBroker, MagicBricks, Housing.com)', 'Update photos, rates and availability; log enquiries.', 'Monthly', 'Long-stay enquiries', 'Pawan & Anupam'],
  // sales & OTA team (Anupam, Sandeep, Kostub)
  ['S-RANK',     'sales', 'OTA search rank: record each property\'s position on MakeMyTrip & Goibibo for its city', 'Search the city with default filters on a weekday; note page and position.', 'Weekly', 'Average rank', 'Anupam / Sandeep'],
  ['S-SCORE',    'sales', 'OTA review scores recorded (MakeMyTrip, Booking.com, Agoda) for every property', 'Flag any property below 4.0 / 8.0 to its GM and Saurabh.', 'Weekly', 'Average score (out of 5)', 'Anupam / Sandeep'],
  ['S-PARITY',   'sales', 'Rate parity check: MakeMyTrip, Goibibo, Booking.com, Agoda and website show the same rate', '', 'Weekly', 'Parity breaches found', 'Anupam / Sandeep'],
  ['S-CONTENT',  'sales', 'Listing completeness: 25+ photos, full amenities, description, correct map pin', '', 'Weekly', '% listings 100% complete', 'Anupam / Sandeep'],
  ['S-SHARE',    'sales', 'OTA performance: room-nights and revenue by channel; OTA share of revenue', 'From the channel manager / extranets.', 'Weekly', 'OTA share of revenue %', 'Anupam / Sandeep'],
  ['S-FUNNEL',   'sales', 'Extranet analytics: listing views, conversion %, cancellations and rejections', '', 'Weekly', 'Conversion %', 'Anupam / Sandeep'],
  ['S-DEALS',    'sales', 'Deals & sale events: early-bird / last-minute / mobile deals and platform sales joined', 'MakeMyTrip Big Hotel Sale, Goibibo GoFest, Agoda flash deals.', 'Weekly', 'Active deals', 'Anupam / Sandeep'],
  ['S-RESPONSE', 'sales', 'OTA guest messages answered fast; complaints closed', '', 'Weekly', 'Open complaints', 'Anupam / Sandeep'],
  ['S-INCENTIVE','sales', 'Field-visit incentive contracts signed (HR vouchers / stays by room-nights)', 'Signed, stamped contract on the spot.', 'Weekly', 'Contracts signed', 'Anupam'],
  ['S-PIPELINE', 'sales', 'Weekly sales update: leads added, conversions, room-nights by segment', '', 'Weekly', 'New leads', 'Anupam'],
  ['S-DASH',     'sales', 'Monthly sales dashboard sent to the directors', 'Leads, conversions, room-nights by segment, banquet/MICE won, revenue by channel.', 'Monthly', '', 'Anupam'],
  // marketing team, Gurugram (Pawan, Ashutosh)
  ['M-FIELD',    'marketing', 'Corporate field visits in Delhi NCR', 'Carry incentive contracts; log every visit.', 'Weekly', 'Visits made', 'Pawan'],
  ['M-LEADS',    'marketing', 'All leads and approaches logged in the sales sheet', '', 'Weekly', 'Leads logged', 'Pawan'],
  ['M-LONGSTAY', 'marketing', 'Long-stay platform listings: new properties listed / refreshed', 'Work with each GM for photos and rates.', 'Weekly', 'Properties listed', 'Pawan & Ashutosh'],
  // directors
  ['C-REVIEW',   'corporate', 'Weekly review of property compliance and stuck items', 'Use this dashboard; call any property with 2+ missed routines.', 'Weekly', '', 'Directors'],
  ['C-SEO',      'corporate', 'SEO & Google Business Profile: weekly check of all 9 profiles and websites', '', 'Weekly', 'Profiles updated', 'Gaurav'],
];

// One-off tasks created at setup. [board ('ALL_PROPERTIES' = one per property), task, owner, priority]
const SEED_TASKS = [
  // every property (GM)
  ['ALL_PROPERTIES', 'Google Business Profile: claimed and verified, NAP identical everywhere, 30+ photos, booking link added', 'GM', 'High'],
  ['ALL_PROPERTIES', 'List the banquet hall on Google Business Profile for bookings (liaise with Gaurav)', 'GM', 'High'],
  ['ALL_PROPERTIES', 'List the restaurant on Google Business Profile for bookings (liaise with Gaurav)', 'GM', 'Medium'],
  ['ALL_PROPERTIES', 'Long-stay listing live on 99acres / NoBroker / MagicBricks (with Pawan & Anupam)', 'GM', 'Medium'],
  ['ALL_PROPERTIES', 'Set up the checkout treat tray (cookies, protein bars, chocolates) with the review card and QR', 'GM', 'Medium'],
  ['ALL_PROPERTIES', 'Map the local catchment: top 20 companies, hospitals and offices within 5 km', 'GM', 'Medium'],
  // group roles held by GMs
  ['haldwani', 'Group role: create one shared Google Drive folder per property per week and share with all GMs', 'Shravan Khan', 'High'],
  ['haldwani', 'Group role: every Monday, remind all GMs to upload content; chase any property not ticked', 'Shravan Khan', 'High'],
  ['haldwani', 'Group role (with Santosh): agree the checkout-treat and review-request routine for all properties', 'Shravan Khan', 'Medium'],
  ['ranchi', 'Group role: brief all GMs on the checkout rule (2nd/3rd in-charge meets every guest)', 'Santosh Kumar', 'High'],
  ['ranchi', 'Group role: QR audit: collect photos of every property\'s QR codes and get wrong links fixed with Gaurav', 'Santosh Kumar', 'High'],
  ['ranchi', 'Group role (with Shravan): track checkout-treat stock and review uplift per property', 'Santosh Kumar', 'Medium'],
  ['goa', 'Group role: publish the approved review-reply format to all GMs (agree wording with Gaurav)', 'Saurabh Singh', 'High'],
  ['goa', 'Group role: set up the weekly review tracker (new Google/OTA reviews and replies per property)', 'Saurabh Singh', 'Medium'],
  // sales & OTA (strategy document, section 10A + incentive programme)
  ['sales', 'All 9 properties live and optimised on the four Tier-1 OTAs (MakeMyTrip, Goibibo, Booking.com, Agoda) via one channel manager with strict rate parity', 'Anupam', 'High'],
  ['sales', 'Assign OTA owners: split properties and OTAs between Pawan and Kostub', 'Anupam', 'High'],
  ['sales', 'Field incentive contract: design the on-the-spot agreement (Amazon vouchers / hotel stays for HR by room-night slabs), signed, stamped and sealed', 'Anupam', 'High'],
  ['sales', 'Get the incentive slabs approved by the directors and Ramavtar (finance)', 'Anupam', 'High'],
  ['sales', 'Print contract packs and brief every field salesperson on using them', 'Anupam', 'Medium'],
  ['sales', 'Negotiate Preferred / Premier-partner placement on the highest-margin properties', 'Anupam', 'Medium'],
  ['sales', 'Build the central corporate-account book and negotiate corporate rate agreements across all catchments', 'Anupam', 'High'],
  ['sales', 'Sign up to 1–2 B2B travel-trade platforms and publish an agent tariff', 'Sandeep', 'Medium'],
  ['sales', 'Create a standard MICE & banquet kit and RFP-response process for every property', 'Sandeep', 'Medium'],
  ['sales', 'Build the annual season calendar (weddings + corporate events) per region with a pre-selling campaign', 'Sandeep', 'Medium'],
  ['sales', 'Set up the sales reporting sheet (CRM fields) and the weekly → monthly dashboard for the directors', 'Anupam', 'High'],
  ['sales', 'Brand consistency: one photo, logo and tone standard across OTAs, Google profiles and website', 'Anupam', 'Medium'],
  ['sales', 'Direct-booking push: booking engine on the website, best-rate guarantee, repeat-guest offer', 'Anupam', 'Medium'],
  ['sales', 'Rate & revenue policy: peak pricing, protected direct inventory, parity enforcement', 'Anupam', 'Medium'],
  ['sales', 'Long-stay listing plan for all 9 properties (with Pawan)', 'Anupam', 'Medium'],
  // marketing, Gurugram
  ['marketing', 'List every property on long-stay platforms across India (99acres, NoBroker, MagicBricks, Housing.com) with each GM', 'Pawan', 'High'],
  ['marketing', 'Follow up Belmet India (about 90% occupancy for a month) and Apollo Tyres leads', 'Ashutosh Singh', 'High'],
  ['marketing', 'Cross Tools (Noida–Greater Noida Expressway): meet HR after Diwali', 'Ashutosh Singh', 'Medium'],
  ['marketing', 'Corporate sales support for Goa from Delhi/NCR companies for Nov–Jan', 'Pawan', 'Medium'],
  ['marketing', 'Loyalty pitch wording: always refer to "the company", never "you"', 'Ashutosh Singh', 'Low'],
  // directors
  ['corporate', 'Fix the QR redirect links from the photos GMs send', 'Gaurav Wankhede', 'High'],
  ['corporate', 'GMB team: weekly posts for all 9 Google Business Profiles', 'Gaurav Wankhede', 'High'],
  ['corporate', 'Approve the field incentive slabs with Ramavtar (finance)', 'Rakesh Chaturvedi', 'Medium'],
];
