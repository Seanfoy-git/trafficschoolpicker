# Directory websites re-check (dry run), November 2026

Generated 2026-11-17 by `scripts/recheck-directory-websites.ts`. **Nothing has been written to Notion.** The apply writes these verdicts from the saved lookups, with no new Places calls, after Sean approves.

Verdicts:

- **State DMV**: the state's own list (scraper dry run today) gives the same website. The apply sets Website Source = State DMV.
- **Confirmed**: a proved Places listing (address and name evidence, see `scripts/lib/places-match.ts`) has the same registrable domain. The apply writes the provenance fields only.
- **Changed**: a proved listing has a different website. The apply writes the proposed one.
- **Address only**: a listing at the row's address without the school's name. The apply clears Website.
- **Unconfirmed**: nothing proved. The apply clears Website, and the table shows "—".

Scope: 2091 rows with a Website not set by hand (1 hand-set rows left out). Places lookups: 1701 of 1701 (one per licence). Calls: 1701 Text Search Pro and 933 Place Details, $73.09 at list price before Google's monthly free calls.

## Counts per state

| State | Rows | Distinct licences | State DMV | Confirmed | Changed | Address only | Unconfirmed |
|---|---:|---:|---:|---:|---:|---:|---:|
| Arizona | 511 | 280 | 0 | 44 | 11 | 0 | 456 |
| California | 216 | 216 | 0 | 84 | 15 | 42 | 75 |
| Connecticut | 24 | 24 | 21 | 0 | 0 | 0 | 3 |
| Florida | 51 | 51 | 0 | 4 | 3 | 0 | 44 |
| Georgia | 100 | 96 | 0 | 57 | 2 | 30 | 11 |
| Maryland | 14 | 14 | 0 | 0 | 0 | 0 | 14 |
| Minnesota | 11 | 11 | 11 | 0 | 0 | 0 | 0 |
| Nevada | 55 | 55 | 0 | 0 | 0 | 0 | 55 |
| New Jersey | 71 | 71 | 66 | 0 | 0 | 0 | 5 |
| New York | 24 | 24 | 0 | 5 | 1 | 3 | 15 |
| North Dakota | 18 | 18 | 0 | 0 | 0 | 0 | 18 |
| Ohio | 27 | 27 | 26 | 0 | 0 | 0 | 1 |
| Oregon | 12 | 12 | 10 | 0 | 0 | 0 | 2 |
| South Carolina | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| Tennessee | 20 | 20 | 20 | 0 | 0 | 0 | 0 |
| Texas | 801 | 801 | 0 | 342 | 36 | 142 | 281 |
| Utah | 4 | 4 | 0 | 2 | 0 | 0 | 2 |
| Virginia | 122 | 122 | 1 | 33 | 4 | 0 | 84 |
| Washington | 9 | 9 | 0 | 0 | 0 | 0 | 9 |
| **Total** | **2091** | **1856** | **155** | **571** | **72** | **217** | **1076** |

Distinct licences: a placeholder licence ("NJ-approved", blank) counts each row as its own school.

## Named rows

| State | Licence | Name | Address | Current website | Verdict | Proposed | Why |
|---|---|---|---|---|---|---|---|
| Texas | C3442 | SAFEWAY DRIVING | HOUSTON, TX, 77024 | https://www.saferoutedriving.com/ | Unconfirmed | — | listing SafeWay Driving Memorial (ChIJJd5CuonEQIYRYOKU_If2Mos) was also proved for C3656 SAFEWAY DRIVING |
| Texas | C3627 | SAFEWAY DRIVING | SPRING, TX, 77380-3847 | https://www.saferoutedriving.com/ | Changed | http://www.safewaydriving.com/ | zip+name, name evidence: SafeWay Driving The Woodlands, 2260 Buckthorne Pl #183, The Woodlands, TX 77380, USA |
| Texas | C3631 | SAFEWAY DRIVING | KATY, TX, 77494-1146 | https://www.saferoutedriving.com/ | Unconfirmed | — | listing SafeWay Driving Katy / Fulshear (ChIJa-7M1DskQYYR2eflAQSnj04) was also proved for C3691 SAFEWAY DRIVING |
| Texas | C3638 | SAFEWAY DRIVING | SCHERTZ, TX, 78154-2172 | https://www.saferoutedriving.com/ | Changed | https://www.safewaydriving.com/locations/schertz | zip+name, name evidence: SafeWay Driving Schertz, 17480 I-35 N, Schertz, TX 78154, USA |
| Texas | C3639 | SAFEWAY DRIVING | BELLAIRE, TX, 77401-3967 | https://www.safewaydriving.com/locations/memorial/pricing | Unconfirmed | — | no candidate in this ZIP with the school's name |
| Texas | C3656 | SAFEWAY DRIVING | Suite 105, HOUSTON, TX, 77024 | https://www.saferoutedriving.com/ | Unconfirmed | — | listing SafeWay Driving Memorial (ChIJJd5CuonEQIYRYOKU_If2Mos) was also proved for C3442 SAFEWAY DRIVING |
| Texas | C3662 | SAFEWAY DRIVING | DALLAS, TX, 75225 | https://www.saferoutedriving.com/ | Unconfirmed | — | no candidate in this ZIP with the school's name |
| Texas | C3683 | SAFEWAY DRIVING | MISSOURI CITY, TX, 77459 | https://www.saferoutedriving.com/ | Unconfirmed | — | no candidate in this ZIP with the school's name |
| Texas | C3691 | SAFEWAY DRIVING | KATY, TX, 77494 | https://www.saferoutedriving.com/ | Unconfirmed | — | listing SafeWay Driving Katy / Fulshear (ChIJa-7M1DskQYYR2eflAQSnj04) was also proved for C3631 SAFEWAY DRIVING |
| Texas | C3693 | SAFEWAY DRIVING | COLLEGE STATION, TX, 77845 | https://www.saferoutedriving.com/ | Unconfirmed | — | no candidate in this ZIP with the school's name |
| California | E0067 | CHEAP SCHOOL | 8215 VAN NUYS BLVD 306B,PANORAMA CITY,CA 91402 | http://www.5buckstrafficschool.com/ | Address only | — | Comedy School Online, 8215 Van Nuys Blvd #310, Panorama City, CA 91402, USA, https://www.comedyschoolonline.com/ |
| California | E0119 | COMEDYTRAFFICSCHOOL COM | 1500 ROSECRANS AVE RM31 SUITE 500,MANHATTAN BEACH,CA 90266 | https://www.comedytrafficschool.com/ | Unconfirmed | — | listing Comedy Traffic School (ChIJRS67P9e2woARc_EGD78wCS0) was also proved for E1989 WORLD FAMOUS COMEDY TRAFFIC SCHOOL |
| California | E0127 | ANYTIMETRAFFICSCHOOLCOM/AV TVS | 42630 10TH ST W UNIT 3B,LANCASTER,CA 93534 | http://www.trafficschool.com/ | Address only | — | Day Or Night Driving School, 42630 10th St W #3C, Lancaster, CA 93534, USA, http://www.dayornighttrafficschool.com/ |
| California | E0129 | DAYORNIGHTTRAFFICSCHOOLCOM/ANGELS | 42630 10TH ST W UNIT 3C,LANCASTER,CA 93534 | https://www.urbantrafficschool.com/ | Changed | http://www.dayornighttrafficschool.com/ | address, website evidence: Day Or Night Driving School, 42630 10th St W #3C, Lancaster, CA 93534, USA |
| California | E0138 | IDRIVESAFELYCOM | 100 E SAN MARCOS BLVD STE 425,SAN MARCOS,CA 92069 | http://www.idriveez.com/ | Changed | https://www.idrivesafely.com/traffic-school/california/san-diego-traffic-school/?id=LocalPack&utm_source=google&utm_medium=organic&utm_campaign=Local%20Pack%20-%20Carlsbad | address, name evidence: I Drive Safely, 100 E San Marcos Blvd Ste 425, San Marcos, CA 92069, USA |
| California | E0462 | COMEDY SCHOOL | 8215 VAN NUYS BLVD 310B,PANORAMA CITY,CA 91402 | https://www.comedytrafficschool.com/ | Changed | https://www.comedyschoolonline.com/ | address, name evidence: Comedy School Online, 8215 Van Nuys Blvd #310, Panorama City, CA 91402, USA |
| California | E0803 | ACEABLE TRAFFIC SCHOOL | 100 E SAN MARCOS BLVD STE 439,SAN MARCOS,CA 92069 | http://www.acedriversed.com/ | Unconfirmed | — | no candidates |
| California | E0893 | www Cheap Traffic School 365 com | 206 W 4TH ST STE 325,SANTA ANA,CA 92701 | http://www.5dollartrafficschool.com/ | Unconfirmed | — | no candidate at this street number and ZIP |
| California | E0948 | DUMMIESTRAFFICSCHOOLCOM | 524 N MOUNTAIN VIEW AVE 2,SAN BERNARDINO,CA 92401 | http://www.trafficschool.com/ | Address only | — | Escuela de Trafico, 524 N Mountain View Ave, San Bernardino, CA 92401, USA, https://www.baratoescueladetrafico.com/contact_s.jsp |
| California | E0954 | 3DollarsQuickTrafficSchool com | 524 MOUNTAIN VIEW AVE 4,SAN BERNARDINO,CA 92401 | http://www.5dollartrafficschool.com/ | Address only | — | Escuela de Trafico, 524 N Mountain View Ave, San Bernardino, CA 92401, USA, https://www.baratoescueladetrafico.com/contact_s.jsp |
| California | E0957 | BARATOESCUELADETRAFICOCOM | 524 N MOUNTAIN VIEW AVE 3,SAN BERNARDINO,CA 92401 | http://www.trafficschool.com/ | Changed | https://www.baratoescueladetrafico.com/contact_s.jsp | address, website evidence: Escuela de Trafico, 524 N Mountain View Ave, San Bernardino, CA 92401, USA |
| California | E0962 | IPaylessTrafficSchoolcom | 524 MOUNTAIN VIEW AVE 1,SAN BERNARDINO,CA 92401 | https://www.trafficschoolforless.com/ | Unconfirmed | — | no candidate at this street number and ZIP |
| California | E1008 | California Licensing Education | 3800 MARKET STREET UNIT K,VENTURA,CA 93003 | https://traffic.californialicensingeducation.com/ | Hand-set: untouched | https://traffic.californialicensingeducation.com/ | Website Source Manual, Enrichment Status Manual |
| California | E1293 | ///wwwEasyQuickTrafficSchoolcom/// | 1412 17TH STREET SUITE 347,BAKERSFIELD,CA 93301 | https://easyquicktrafficschool.com/ | Confirmed | https://easyquicktrafficschool.com/ | address, name evidence: Easy Quick Traffic School, 1412 17th St Ste 347, Bakersfield, CA 93301, USA |
| California | E1392 | CHAMPION TRAFFIC SCHOOL | 19083 COLIMA RD,ROWLAND HEIGHTS,CA 91748 | http://www.cadmv.com/ | Confirmed | http://www.cadmv.com/ | address, name evidence: CADMV CHAMPION TRAFFIC SCHOOL & REGISTRATION SERVICES, 19083 Colima Rd, Rowland Heights, CA 91748, USA |
| California | E1883 | wwwGot A Ticketcom FASTEST COURSE | 1412 17TH ST STE 257,BAKERSFIELD,CA 93301-5219 | https://fastticketcourse.com/ | Unconfirmed | — | no candidates |
| California | E1989 | WORLD FAMOUS COMEDY TRAFFIC SCHOOL | 1500 ROSECRANS AVE RM22 SUITE 500,MANHATTAN BEACH,CA 90266 | https://www.comedytrafficschool.com/ | Unconfirmed | — | listing Comedy Traffic School (ChIJRS67P9e2woARc_EGD78wCS0) was also proved for E0119 COMEDYTRAFFICSCHOOL COM |
| California | E9634 | FAST CERTIFICATE www1HourCoursecom | 1412 17TH ST STE 203,BAKERSFIELD,CA 93301 | https://www.1hourfix.com/ | Address only | — | Easy Quick Traffic School, 1412 17th St Ste 347, Bakersfield, CA 93301, USA, https://easyquicktrafficschool.com/ |

## Changed (72)

| State | Licence | Name | Address | Current website | Proposed | Why |
|---|---|---|---|---|---|---|
| Arizona | 058 | Arizona Defensive Driving School | — | https://www.azfast4hourdd.com/ | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | name, name evidence: Defensive Driving Arizona - IMPROV Phoenix, 2828 N Central Ave 10th Floor, Phoenix, AZ 85004, USA |
| Arizona | 058 | Arizona Defensive Driving School | — | https://www.azfast4hourdd.com/ | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | name, name evidence: Defensive Driving Arizona - IMPROV Phoenix, 2828 N Central Ave 10th Floor, Phoenix, AZ 85004, USA |
| Arizona | 095 | Express Arizona Defensive Driving School | — | https://expressticketdismissal.com/ | https://www.expressdd.com/ | name, name evidence: Express Defensive Driving School Arizona, 4245 S Arizona Ave Ste 7, Chandler, AZ 85248, USA |
| Arizona | 095 | Express Arizona Defensive Driving School | — | https://expressticketdismissal.com/ | https://www.expressdd.com/ | name, name evidence: Express Defensive Driving School Arizona, 4245 S Arizona Ave Ste 7, Chandler, AZ 85248, USA |
| Arizona | 520 | Express Defensive Driving School Arizona | — | https://expressticketdismissal.com/ | https://www.expressdd.com/ | name, name evidence: Express Defensive Driving School Arizona, 4245 S Arizona Ave Ste 7, Chandler, AZ 85248, USA |
| Arizona | 520 | Express Defensive Driving School Arizona | — | https://expressticketdismissal.com/ | https://www.expressdd.com/ | name, name evidence: Express Defensive Driving School Arizona, 4245 S Arizona Ave Ste 7, Chandler, AZ 85248, USA |
| Arizona | de | German | — | http://www.discounttrafficsurvivalschool.com/ | https://azgermanschool.com/ | name, name evidence: Arizona German Language School, 1951 N Alma School Rd, Chandler, AZ 85224, USA |
| Arizona | hu | Hungarian | — | https://azkartss.com/ | https://hcaphoenix.org/ | name, name evidence: Hungarian Cultural Association of Phoenix, 5318 W Bloomfield Rd, Glendale, AZ 85304, USA |
| Arizona | it | Italian | — | http://www.discounttrafficsurvivalschool.com/ | http://valentilingua.com/ | name, name evidence: Valenti Lingua Italian Language School, 3863 E Cathedral Rock Dr, Phoenix, AZ 85044, USA |
| Arizona | iw | Hebrew | — | https://rulesoftheroadaz.com/ | https://www.thaaz.org/ | name, name evidence: Tucson Hebrew Academy, 3888 E River Rd, Tucson, AZ 85718, USA |
| Arizona | ru | Russian | — | https://rulesoftheroadaz.com/ | http://darrussianschool.com/ | name, name evidence: DAR Russian school, 1730 E Elliot Rd, Tempe, AZ 85284, USA |
| California | E0129 | DAYORNIGHTTRAFFICSCHOOLCOM/ANGELS | 42630 10TH ST W UNIT 3C,LANCASTER,CA 93534 | https://www.urbantrafficschool.com/ | http://www.dayornighttrafficschool.com/ | address, website evidence: Day Or Night Driving School, 42630 10th St W #3C, Lancaster, CA 93534, USA |
| California | E0138 | IDRIVESAFELYCOM | 100 E SAN MARCOS BLVD STE 425,SAN MARCOS,CA 92069 | http://www.idriveez.com/ | https://www.idrivesafely.com/traffic-school/california/san-diego-traffic-school/?id=LocalPack&utm_source=google&utm_medium=organic&utm_campaign=Local%20Pack%20-%20Carlsbad | address, name evidence: I Drive Safely, 100 E San Marcos Blvd Ste 425, San Marcos, CA 92069, USA |
| California | E0153 | TRAFFIC SCHOOL SIMPLE COM | 23276 S POINTE DR 214,LAGUNA HILLS,CA 92653 | https://www.urbantrafficschool.com/ | https://www.trafficschoolsimple.com/ | address, name evidence: Traffic School Simple, 23276 S Pointe Dr Ste 214, Laguna Hills, CA 92653, USA |
| California | E0155 | NO FAIL FAST CERT www60MinCoursecom | 1234 L ST,BAKERSFIELD,CA 93301-4507 | http://www.5dollartrafficschool.com/ | https://60mincourse.com/ | address, website evidence: 60MinCourse.com, 1234 L St, Bakersfield, CA 93301, USA |
| California | E0193 | 1 HOUR wwwVeryFastTrafficSchoolcom | 3960 ALKEN ST,BAKERSFIELD,CA 93308 | http://www.trafficschool.com/ | https://www.veryfasttrafficschool.com/ | address, website evidence: Very Fast Traffic School, 3960 Alken St, Bakersfield, CA 93308, USA |
| California | E0321 | 1 HR OR LESS wwwReallyFastCoursecom | 525 E CALIFORNIA AVE,BAKERSFIELD,CA 93307-1141 | https://www.1hourfix.com/ | https://www.reallyfastcourse.com/ | address, website evidence: Really Fast Course Traffic School, 525 E California Ave, Bakersfield, CA 93307, USA |
| California | E0462 | COMEDY SCHOOL | 8215 VAN NUYS BLVD 310B,PANORAMA CITY,CA 91402 | https://www.comedytrafficschool.com/ | https://www.comedyschoolonline.com/ | address, name evidence: Comedy School Online, 8215 Van Nuys Blvd #310, Panorama City, CA 91402, USA |
| California | E0818 | Essential Traffic School | 472 N ARROWHEAD AVE,SAN BERNARDINO,CA 92401 | https://start.bestonlinetrafficschool.co/sign-up?utm_source=google&utm_medium=local&utm_campaign=gmb | http://www.essentialregistration.com/ | address, name evidence: Essential Registration & Multi Services, 472 N Arrowhead Ave, San Bernardino, CA 92401, USA |
| California | E0957 | BARATOESCUELADETRAFICOCOM | 524 N MOUNTAIN VIEW AVE 3,SAN BERNARDINO,CA 92401 | http://www.trafficschool.com/ | https://www.baratoescueladetrafico.com/contact_s.jsp | address, website evidence: Escuela de Trafico, 524 N Mountain View Ave, San Bernardino, CA 92401, USA |
| California | E1294 | 1 HOUR wwwQuickEasyTrafficSchoolcom | 2801 BRUNDAGE LN STE C,BAKERSFIELD,CA 93304 | https://www.1hrfix.com/ | https://quickeasytrafficschool.com/ | address, website evidence: QuickEasyTrafficSchool, 2801 Brundage Ln C, Bakersfield, CA 93304, USA |
| California | E1447 | NORCAL DRIVING SCHOOL | 5212 HEARTLAND DR,ANTELOPE,CA 95843 | https://www.northcaldrivingschool.com/ | https://www.norcaldriving.com/ | address, name evidence: NorCal Driving School, 5212 Heartland Dr, Antelope, CA 95843, USA |
| California | E1654 | SAV ON DRIVING/TRAFFIC SCHOOL | 1111 S GLENDALE AVE 203,GLENDALE,CA 91205 | http://www.trafficschool.com/ | http://www.savontrafficschool.com/ | address, name evidence: SAV-ON DRIVING AND TRAFFIC SCHOOL E1654, 1111 S Glendale Ave #203, Glendale, CA 91205, USA |
| California | E1900 | FINISHTODAYTRAFFICSCHOOLCOM | 8897 NORTH FULLER AVE,FRESNO,CA 93720 | https://www.donetodaytrafficschool.com/contact-us | https://finishtodaytrafficschool.com/index.cfm?fuseaction=Main.showContact | address, name evidence: FinishTodayTrafficSchool.com, 8897 N Fuller Ave, Fresno, CA 93720, USA |
| California | E1984 | CHEAP TRAFFIC SCHOOL 24 7 | 6912 OWENSMOUTH SUITE 100,CANOGA PARK,CA 91303 | http://www.5buckstrafficschool.com/ | http://www.cheaptrafficschool247.com/ | address, name evidence: Cheap Traffic School 247, 6912 Owensmouth Ave, Canoga Park, CA 91303, USA |
| California | E9561 | EASYTRAFFICSCHOOLCOM | 2160 FLETCHER PKWY STE 104,EL CAJON,CA 92020 | https://www.easytrafficonline.com/ | https://www.easytrafficschool.com/ | address, name evidence: Easy Traffic School, 2160 Fletcher Pkwy Ste 104, El Cajon, CA 92020, USA |
| Florida | — | Highway Traffic School | — | https://www.highwaytrafficschool.com/Florida/Basic-Driver-Improvement-Traffic-School.aspx | http://www.floridahighwaytrafficschool.com/ | name, name evidence: FLORIDA HIGHWAY TRAFFIC SCHOOL, 1344 NE 163rd St, North Miami Beach, FL 33162, USA |
| Florida | — | American Safety Council | — | https://www.floridaonlinetrafficschool.com/ | https://www.americansafetycouncil.com/ | name, name evidence: American Safety Council, Inc., 225 E Robinson St #570, Orlando, FL 32801, USA |
| Florida | — | Driver Training Associates, Inc | — | http://www.ticketschool.com/florida | http://www.drivertrainingassociates.com/ | name, name evidence: Driver Training Associates, Inc., 331 W Central Ave Ste 248, Winter Haven, FL 33880, USA |
| Georgia | DI002226 | <APPROVED> RISK REDUCTION | 5 HURRICANE SHOALS RD NE STE C LAWRENCEVILLE GA 30046-4562 | http://www.secondchanceriskreduction.com/ | https://www.approveddrivingschool.com/ | address, name evidence: Approved Risk Reduction Services LLC, 5 Hurricane Shoals Rd NE Ste C, Lawrenceville, GA 30046, USA |
| Georgia | DI002371 | DIVERSIFIED INSURANCE, LLC | 2896 N EXPRESSWAY STE A GRIFFIN GA 30223-7254 | https://diversifiedshield.com/ | https://diversifiedinsco.com/ | address, name evidence: Diversified Insurance, 2896 N Expy Suite A, Griffin, GA 30223, USA |
| New York | NY-PIRP | Traffic Safety Consultants, Inc. | Traffic Safety Consultants, Inc. | https://www.lowcostaccidentprevention.com/ | http://trafficsafetyconsultants.com/ | name, name evidence: Traffic Safety Consultants, Inc.,, 3092 Aloma Ave Apt 205, Winter Park, FL 32792, USA |
| Texas | 003-907-001 | CENTRAL ISD | 7622 U S HWY 69 NORTH, POLLOK, TX, 75969 | http://www.ctdriving.com/ | http://www.centralisd.com/ | address, website evidence: Central Independent School District, 7622 US-69, Pollok, TX 75969, USA |
| Texas | 046-901-000 | NEW BRAUNFELS ISD | NEW BRAUNFELS, TX, 78130-5304 | https://www.alldriveta.com/ | https://www.nbisd.org/departments/transportation | zip+name, name evidence: New Braunfels ISD Transportation, 2621 Klein Way, New Braunfels, TX 78130, USA |
| Texas | 079-907-001 | FORT BEND ISD - DULLES | 550 DULLES AVENUE, SUGAR LAND, TX, 77478 | http://fortbenddrivingschool.com/ | http://www.fortbendisd.com/dhs | address, website evidence: Dulles High School, 550 Dulles Ave, Sugar Land, TX 77478, USA |
| Texas | 080-910-001 | MT VERNON ISD | 501 HWY 37 SOUTH, MT VERNON, TX, 75457 | https://thedriversedge.net/ | http://www.mtvernonisd.net/ | address, website evidence: Mount Vernon ISD - Administration, 501 TX-37, Mt Vernon, TX 75457, USA |
| Texas | 093-904-002 | NAVASOTA ISD | 705 E WASHINGTON AVENUE, NAVASOTA, TX, 77868 | https://parenttaughtdriversed.net/courses/ | http://www.navasotaisd.org/ | address, website evidence: Navasota Independent School District, 705 E Washington Ave, Navasota, TX 77868, USA |
| Texas | 105-904-001 | DRIPPING SPRINGS ISD | DRIPPING SPRINGS, TX, 78620-5316 | http://iapdworld.com/ | https://www.dsisdtx.us/ | zip+name, name evidence: Dripping Springs ISD Administration, 300 Sportsplex Dr, Dripping Springs, TX 78620, USA |
| Texas | 107-904-001 | CROSS ROADS ISD | 14434 FM 59, MALAKOFF, TX, 75148 | https://crossroaddrivingschool.com/ | https://www.crossroadsisd.org/ | address, website evidence: Cross Roads Independent School District, 14434 FM 59, Malakoff, TX 75148, USA |
| Texas | 163-904-001 | HONDO ISD | 2602 AVE E, HONDO, TX, 78861 | http://www.riohondoisd.net/ | https://www.hondoisd.net/ | address, website evidence: Hondo Independent School District, 2602 Avenue E, Hondo, TX 78861, USA |
| Texas | 170-902-001 | CONROE ISD - CONROE HS | 3200 WEST DAVIS, CONROE, TX, 77304 | http://www.conroedrivingschool.com/ | http://chs.conroeisd.net/ | address, website evidence: Conroe High School, 3200 W Davis St, Conroe, TX 77304, USA |
| Texas | 210-901-001 | CENTER ISD | CENTER, TX, 75935 | http://www.safetycenterdrivingschool.com/ | http://www.centerisd.org | zip+name, name evidence: Center ISD Administration, 107 Private Rd 605, Center, TX 75935, USA |
| Texas | 226-906-000 | WALL ISD | 8065 LOOP 570, WALL, TX, 76957 | https://www.texdds.com/ | http://www.wallisd.net/ | address, name evidence: Wall ISD, 8065 Loop 570, Wall, TX 76957, USA |
| Texas | 246-908-001 | LIBERTY HILL ISD | PO BOX 68, LIBERTY HILL, TX, 78642-0068 | https://www.parinamadrivingschool.com/ | https://www.lhisd.org/ | zip+name, name evidence: Liberty Hill ISD Administration Building, 301 Forrest St, Liberty Hill, TX 78642, USA |
| Texas | C1638 | CONROE DRIVING SCHOOL | CONROE, TX, 77301-2579 | http://www.conroedrivingschool.com/ | https://drivewithcds.com/teen-drivers-ed/ | zip+name, name evidence: Conroe Driving School, North Thompson Professional Plaza, 704 N Thompson St #152, Conroe, TX 77301, USA |
| Texas | C1720 | THE ALLIANCE FOR MULTICULTURAL COMMUNITY SERVICES | HOUSTON, TX, 77081-3100 | http://www.catsoftexas.org/ | https://thealliancetx.org/ | zip+name, name evidence: The Alliance for Multicultural Community Services, 6420 Hillcroft Ave, Houston, TX 77081, USA |
| Texas | C1856 | TEXAS DRIVING SCHOOL | SAN ANTONIO, TX, 78221-1650 | https://www.texdds.com/ | https://www.texasdrivingschool.net/ | zip+name, name evidence: Texas Driving School, 197 SW Military Dr, San Antonio, TX 78221, USA |
| Texas | C2128 | DRIVING SCHOOL OF NORTH TEXAS | MCKINNEY, TX, 75070-9102 | https://northtexasdrivingschool.com/ | https://drivingschoolofnorthtexas.com/ | zip+name, name evidence: Driving School of North Texas, 4900 Eldorado Pkwy Ste 132, McKinney, TX 75070, USA |
| Texas | C2588 | GETDEFENSIVE.COM | Ste C, GARDEN GROVE, CA, 92844-1005 | http://www.defensivedriving.com/ | http://www.getdefensive.com/ | zip+name, name evidence: GetDefensive, 8034 W Garden Grove Blvd STE C, Garden Grove, CA 92844, USA |
| Texas | C2615 | TONY DRIVING SCHOOL | HOUSTON, TX, 77077-5731 | http://www.thanhdaylaixe.com/ | https://tonydrivingschools.com/ | zip+name, name evidence: Tony Driving School#2, 2382 S Dairy Ashford Rd B, Houston, TX 77077, USA |
| Texas | C2651 | A TO Z DRIVING SCHOOL | HOUSTON, TX, 77067-4029 | https://a2zdrivingschooldallas.com/ | http://atozdrivingschoolhouston.com/ | zip+name, name evidence: A to Z Driving School, 11233 Crown Park Dr B, Houston, TX 77067, USA |
| Texas | C2702 | ELITE DRIVING SCHOOL | HUMBLE, TX, 77396-4634 | https://www.elitedriving.academy/ | http://www.elitedriversed.com/ | zip+name, name evidence: Elite Driving School, 2325 Atascocita Road e103, Humble, TX 77396, USA |
| Texas | C3239 | AC DRIVING SCHOOL | MIDLOTHIAN, TX, 76065-5961 | http://acdrivingschool233.com/ | http://acdrivingschooltx.com/ | zip+name, name evidence: AC Driving School, 1590 W FM 875 Suite 100, Midlothian, TX 76065, USA |
| Texas | C3240 | TOP PROFESSIONAL DRIVING SCHOOL | DALLAS, TX, 75243-5150 | http://topprofessionaldriving.com/ | http://topprofessionalsdriving.com/ | zip+name, name evidence: Top Professional Driving School, 9720 Skillman St, Dallas, TX 75243, USA |
| Texas | C3384 | BLUEBONNET DRIVING SCHOOL | 7/26/2027, PLANO, COLLIN | https://bluebonnetds.com/contact-us/ | https://bluebonnetdrivingschool.com/ | name, name evidence: BlueBonnet Driving School LLC, 820 W Spring Creek Pkwy Ste 400 N (2nd floor, Plano, TX 75023, USA |
| Texas | C3433 | GULF DRIVING SCHOOL LLC | 7909 HILLCROFT ST STE E, HOUSTON, TX, 77081 | http://gulfcoastds.net/ | https://www.facebook.com/profile.php?id=100085895887744 | address, name evidence: GULF DRIVING SCHOOL, 7909 Hillcroft St, Houston, TX 77081, USA |
| Texas | C3478 | BEST AUTO DRIVING SCHOOL | IRVING, TX, 75061-4512 | https://bestdrivingschool.us/ | https://bestautodrivingschool.com/ | zip+name, name evidence: BEST AUTO DRIVING SCHOOL, 901 N O'Connor Rd #125, Irving, TX 75061, USA |
| Texas | C3512 | CDL FUTURE TRUCKING ACADEMY LLC | CROSBY, TX, 77532 | https://acetruckingacademy.com/ | http://www.cdlfutureinc.com/ | zip+name, name evidence: CDL future trucking academy LLC, 2921 US-90 Ste 3, Crosby, TX 77532, USA |
| Texas | C3581 | PARINAMA DRIVING SCHOOL | CEDAR PARK, TX, 78641-6361 | https://parinamacollegeconsulting.com/ | https://parinamadrivingschool.com/ | zip+name, name evidence: Parinama Driving School & License Testing Center, 14300 Ronald Reagan Blvd #406, Leander, TX 78641, USA |
| Texas | C3613 | ADVANCED DRIVING SCHOOL | DALLAS, TX, 75244 | https://www.urbantrafficschool.com/ | https://advanceddrivingschool.us/ | zip+name, name evidence: Advanced Driving School, 4100 Spring Valley Rd Ste 158, Dallas, TX 75244, USA |
| Texas | C3627 | SAFEWAY DRIVING | SPRING, TX, 77380-3847 | https://www.saferoutedriving.com/ | http://www.safewaydriving.com/ | zip+name, name evidence: SafeWay Driving The Woodlands, 2260 Buckthorne Pl #183, The Woodlands, TX 77380, USA |
| Texas | C3628 | SMILE DRIVING SCHOOL | Ste A, HOUSTON, TX, 77449 | http://smiledrivingschoolhtx.com/ | https://smiledrivingschoolkatytx.com/ | zip+name, name evidence: SMILE DRIVING SCHOOL KATY,TX, 1808 Snake River Rd Ste A, Katy, TX 77449, USA |
| Texas | C3638 | SAFEWAY DRIVING | SCHERTZ, TX, 78154-2172 | https://www.saferoutedriving.com/ | https://www.safewaydriving.com/locations/schertz | zip+name, name evidence: SafeWay Driving Schertz, 17480 I-35 N, Schertz, TX 78154, USA |
| Texas | C3642 | BUMPER TO BUMPER DRIVERS ACADEMY LLC | DALLAS, TX, 75241 | https://www.urbantrafficschool.com/ | https://bumpertobumperdrivers.com/ | zip+name, name evidence: BUMPER TO BUMPER DRIVERS ACADEMY, 6805 Patrol Way, Dallas, TX 75241, USA |
| Texas | C3659 | MTM DRIVING SCHOOL | HOUSTON, TX, 77036-2145 | http://www.mtdriversed.com/ | https://mtmgroup.co/ | zip+name, name evidence: MTM Group Multiservice, 7111 Harwin Dr. #280, Houston, TX 77036, USA |
| Texas | C3673 | MEMORIAL DRIVING SCHOOL LLC | HOUSTON, TX, 77079 | https://www.safewaydriving.com/locations/memorial/pricing | https://www.memorialdrivingschool.com/ | zip+name, name evidence: Memorial Driving School, 11999 Katy Fwy Suite 150Q, Houston, TX 77079, USA |
| Texas | C3685 | TEXAN DRIVING SCHOOL | LEWISVILLE, TX, 75057 | https://www.texasdrivingschoolcc.com/ | https://txdrivingschools.com/ | zip+name, name evidence: Texan Driving School, 131 Degan Ave Ste 102A, Lewisville, TX 75057, USA |
| Texas | C3690 | CONFIDENT DRIVING SCHOOL | HOUSTON, TX, 77082 | http://www.bconfidentdriving.com/ | https://www.confidentdrivingtx.com/ | zip+name, name evidence: Confident Driving School, 3840 S Dairy Ashford Rd, Houston, TX 77082, USA |
| Virginia | VA-DIC | A1A Driver Improvement Clinics | — | http://a1adriver.com | https://www.a1adriverimprovementclinics.com/locations/ | name, name evidence: A1A Driver Improvement Clinics, 1890 Evelyn Byrd Ave, Harrisonburg, VA 22801, USA |
| Virginia | VA-DIC | Buckle Up Driving School | — | http://www.buckleupdriverva.com | http://www.buckleupbuttercup757.info/?utm_source=google&utm_medium=wix_google_business_profile&utm_campaign=12947473037233168291 | name, name evidence: Buckle Up, Butter Cup Driver Training School, 3435 Hickory Neck Blvd, Toano, VA 23168, USA |
| Virginia | VA-DIC | Prestige Driving School, LLC | — | http://www.prstigedriving.com | http://www.prestigedrivingacademy.com/ | name, name evidence: Prestige Driving Academy, 670 W Coshocton St, Johnstown, OH 43031, USA |
| Virginia | VA-DIC | Uncle Geri's Driving Academy | — | http://unclegeorgedrivingacademy.com | https://unclegerisdrivingacademy.com/ | name, name evidence: Uncle Geri's Driving Academy, 6769 Main St, Gloucester, VA 23061, USA |

## Address only (217)

Both names: the school's (Name) and the listing at its address (Listing).

| State | Licence | Name | Address | Current website | Proposed | Listing |
|---|---|---|---|---|---|---|
| California | E0067 | CHEAP SCHOOL | 8215 VAN NUYS BLVD 306B,PANORAMA CITY,CA 91402 | http://www.5buckstrafficschool.com/ | — | Comedy School Online, 8215 Van Nuys Blvd #310, Panorama City, CA 91402, USA, https://www.comedyschoolonline.com/ |
| California | E0121 | WWW AFFORDABLEHOMESTUDY COM | 14547 TITUS STREET # 108,PANORAMA CITY,CA 91402 | https://www.affordablehomestudy.com/contact.php | — | 14547 Titus St #108, 14547 Titus St #108, Panorama City, CA 91402, USA |
| California | E0127 | ANYTIMETRAFFICSCHOOLCOM/AV TVS | 42630 10TH ST W UNIT 3B,LANCASTER,CA 93534 | http://www.trafficschool.com/ | — | Day Or Night Driving School, 42630 10th St W #3C, Lancaster, CA 93534, USA, http://www.dayornighttrafficschool.com/ |
| California | E0157 | ALL SEASONS TRAFFIC SCHOOL | 9631 BUSINESS CENTER DR STE A,RANCHO CUCAMONGA,CA 91730-4545 | http://allseasondriving.com/ | — | All Star Driving School, 9631 Business Center Dr a, Rancho Cucamonga, CA 91730, USA, https://allstardriving.biz/ |
| California | E0161 | WWW FUN AND EASY ONLINE COM | 20700 VENTURA BLVD 134,WOODLAND HILLS,CA 91364 | https://www.easytrafficonline.com/ | — | Salon Republic Woodland Hills, 20700 Ventura Blvd #100, Woodland Hills, CA 91364, USA, https://salonrepublic.com/locations/woodland-hills-ventura-ca/?utm_source=google&utm_medium=gbp&utm_campaign=gbp-listing&utm_content=woodlandhills |
| California | E0192 | PACIFIC SEMINAR TRAFFIC SAFETY INC | 250 WILDROSE TER,BOULDER CREEK,CA 95006 | http://www.trafficsafetyconsultants.com/contact.php | — | 250 Wildrose Terrace, 250 Wildrose Terrace, Boulder Creek, CA 95006, USA |
| California | E0536 | WWWEASYCHOICETRAFFICSCHOOLCOM | 1151 HARBOR BAY PKWY STE 111,ALAMEDA,CA 94502 | https://www.easytrafficcurse.com/ | — | 1151 Harbor Bay Pkwy #111, 1151 Harbor Bay Pkwy #111, Alameda, CA 94502, USA |
| California | E0541 | ONE CLICK TRAFFIC SCHOOL | 5440 THORNWOOD DR STE F,SAN JOSE,CA 95123 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | Advantage Driving School, Inc, 5440 Thornwood Dr F, San Jose, CA 95123, USA, https://advantagedriversed.com/?utm_source=gbp&utm_medium=organic&utm_campaign=sanjose; Mature Driving Course, 5440 Thornwood Dr, San Jose, CA 95123, USA, https://www.maturedrivingcourse.com/ |
| California | E0608 | DDS TRAFFIC SCHOOL OF SEPULVEDA | 22311 VENTURA BLVD 119,WOODLAND HILLS,CA 91364 | http://www.5dollartrafficschool.com/ | — | Dollar Driving School Inc, 22311 Ventura Blvd Unit 119, Woodland Hills, CA 91364, USA, http://dollardrivingschool.com/about |
| California | E0673 | WWW EASYPASSCOURSE COM | 1901 FIRST AVENUE #217J,SAN DIEGO,CA 92101 | https://www.easytrafficcurse.com/ | — | 1901 First Ave. Ste 217J, 1901 First Ave. Ste 217J, San Diego, CA 92101, USA |
| California | E0779 | California FastPass Traffic School | 525 CABRILLO PARK DRIVE SUITE 150,SANTA ANA,CA 92701 | http://www.trafficschool.com/ | — | National Traffic Safety Institute, 525 Cabrillo Park Dr Ste 150, Santa Ana, CA 92701, USA, https://ntsi.com/california/ |
| California | E0781 | Removeaticketcom | 2400 BRUNDAGE LN,BAKERSFIELD,CA 93304 | https://ticketerasertrafficschool.com/ | — | Canaday Insurance, 2400 Brundage Ln, Bakersfield, CA 93304, USA, https://www.americannational.com/agent?s=larrycanaday-3427 |
| California | E0784 | WWWESCUELADETRAFICOCOM | 524 W CALLE PRIMERA 1005 66,SAN YSIDRO,CA 92173 | http://www.academiadetrafico.com/ | — | Executive Offices, 524 W Calle Primera #1005, San Ysidro, CA 92173, USA, http://www.yourexecutiveoffices.com/ |
| California | E0787 | All Night Online Traffic School | 5812 TEMPLE CITY BLVD,TEMPLE CITY,CA 91780 | https://start.bestonlinetrafficschool.co/sign-up?utm_source=google&utm_medium=local&utm_campaign=gmb | — | Temple City Postal Center, 5812 Temple City Blvd, Temple City, CA 91780, USA |
| California | E0796 | Pixel Driving Academy, LLC | 40 N ALTADENA DR SUITE 102R,PASADENA,CA 91107 | https://www.beepbeeptss.com/ | — | 1 DRIVING SCHOOL, 40 N Altadena Dr Ste 200L, Pasadena, CA 91107, USA, https://1drivingschool.com/ |
| California | E0821 | RoadwiseTrafficSchool LLC | 35858 ESPERIA WAY,FALLBROOK,CA 92028 | http://www.trafficschool.com/ | — | 35858 Esperia Way, 35858 Esperia Way, Fallbrook, CA 92028, USA |
| California | E0873 | 5 D O L L A R TRAFFIC SCHOOL ONLINE | 12325 IMPERIAL HIGHWAY,NORWALK,CA 90650 | http://www.5dollartrafficschool.com/ | — | Imperial Mailbox & Notary Services, 12325 Imperial Hwy., Norwalk, CA 90650, USA, https://imperialboxmail.com/ |
| California | E0948 | DUMMIESTRAFFICSCHOOLCOM | 524 N MOUNTAIN VIEW AVE 2,SAN BERNARDINO,CA 92401 | http://www.trafficschool.com/ | — | Escuela de Trafico, 524 N Mountain View Ave, San Bernardino, CA 92401, USA, https://www.baratoescueladetrafico.com/contact_s.jsp |
| California | E0954 | 3DollarsQuickTrafficSchool com | 524 MOUNTAIN VIEW AVE 4,SAN BERNARDINO,CA 92401 | http://www.5dollartrafficschool.com/ | — | Escuela de Trafico, 524 N Mountain View Ave, San Bernardino, CA 92401, USA, https://www.baratoescueladetrafico.com/contact_s.jsp |
| California | E1210 | CHEAP TRAFFIC SCHOOL FOR LESS | 11500 OLYMPIC BLVD SUITE 400 RM 455,LOS ANGELES,CA 90064 | https://www.trafficschoolforless.com/ | — | Ace Parking (Olympic Plaza), 11500 W Olympic Blvd, Los Angeles, CA 90064, USA, http://www.aceparking.com/find-parking/ |
| California | E1292 | 1 HR OR LESS wwwFastSimpleCoursecom | 211 S MONTCLAIR STREET,BAKERSFIELD,CA 93309 | https://www.fastonlinecourse.com/ | — | Fast Simple Course Traffic School, 211 S Montclair St, Bakersfield, CA 93309, USA, https://www.1hourfix.com/; Easy Quick Course Traffic School, 211 S Montclair St, Bakersfield, CA 93309, USA, https://www.1hrfix.com/ |
| California | E1313 | EASYONLINETRAFFICSCHOOLCOM | 2160 FLETCHER PARKWAY SUITE 112,EL CAJON,CA 92020 | https://www.easytrafficonline.com/ | — | Easy Traffic School, 2160 Fletcher Pkwy Ste 104, El Cajon, CA 92020, USA, https://www.easytrafficschool.com/; Los Angeles Traffic School, 2160 Fletcher Pkwy Ste 112, El Cajon, CA 92020, USA, http://losangelestrafficschool.com/; Traffic Tutors, 2160 Fletcher Pkwy, El Cajon, CA 92020, USA, https://courtticket.com/contact/ |
| California | E1372 | MISSION VALLEY DAY/NIGHT TVS | 2425 CAMINO DEL RIO S 250,SAN DIEGO,CA 92108 | https://mmtrafficschool.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp_san_diego | — | Intouch Chiropractic, 2425 Camino del Rio S #100, San Diego, CA 92108, USA, https://sandiegonucca.com/ |
| California | E1381 | ACE TRAFFIC SCHOOL | 926 E GARVEY AVE STE B,MONTEREY PARK,CA 91755 | http://www.acedriversed.com/ | — | Alhambra Safety Services (Driving School) (San Gabriel Valley), 926 E Garvey Ave, Monterey Park, CA 91755, USA, http://alhambrasafetyservices.com/ |
| California | E1515 | TRAFFICSCHOOLBYIMPROV COM | 21051 WARNER CENTER LANE SUITE 220,WOODLAND HILLS,CA 91367 | https://www.myimprov.com/traffic-school/california?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | IMPROV Traffic School, 21051 Warner Center Ln #220, Woodland Hills, CA 91367, USA, https://www.myimprov.com/traffic-school/california?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing |
| California | E1749 | REDDING TRAFFIC VIOLATOR SCHOOL | 3264 BECHELLI LN,REDDING,CA 96002-2005 | http://www.reddingdriving.com/ | — | Redding Driving School, 3264 Bechelli Ln, Redding, CA 96002, USA, http://www.reddingdriving.com/ |
| California | E1782 | OXFORD TRAFFIC VIOLATOR SCHOOL | 2140 W. OLYMPIC BLVD STE 217,LOS ANGELES,CA 90006 | http://www.gotoxford.com/ | — | Oxford Driving School, 2140 W Olympic Blvd Ste 217, Los Angeles, CA 90006, USA, http://www.gotoxford.com/ |
| California | E1784 | WHY ME PORQUE YO TRAFFIC SCHOOL | 14300 ELSWORTH ST 101,MORENO VALLEY,CA 92553 | https://www.urbantrafficschool.com/ | — | Bumpers Driving School, 14300 Elsworth St, Moreno Valley, CA 92553, USA, http://bumpersed.com/contact.php |
| California | E1879 | WWW EASYOUTTRAFFICSCHOOL COM | 1333 HAYS STREET SUITE 102,SAN LEANDRO,CA 94577 | http://www.trafficschool.com/ | — | Easy For All Traffic School, 1333 Hays St #121, San Leandro, CA 94577, USA |
| California | E1884 | TICKETNOMORECOM | 9417 MEADOW LEAF CT,BAKERSFIELD,CA 93311 | https://www.ticketfixnow.com/ | — | 9417 Meadow Leaf Ct, 9417 Meadow Leaf Ct, Bakersfield, CA 93311, USA |
| California | E1894 | EASY TO PASS TRAFFIC SCHOOL | 4047 FIRST ST STE 119A,LIVERMORE,CA 94551 | https://www.easytrafficonline.com/ | — | Wazir Driving School, 4047 First St, Livermore, CA 94551, USA, http://www.wazirdrivingschool.com/ |
| California | E1898 | TRAFFICSCHOOLQUICKCOM | 343 E MAIN ST STE 513,STOCKTON,CA 95202 | https://www.quicktrafficcourse.com/ | — | In And Out Traffic School, 343 E Main St #716, Stockton, CA 95202, USA, http://www.inandouttrafficschool.com/ |
| California | E1923 | SPANISH AND ENGLISH TRAFFIC SCHOOL | 8938 WOODMAN AVE D2,ARLETA,CA 91331 | https://mittrafficschool.com/index.php | — | CPR For All, 8938 Woodman Ave suite D2, Arleta, CA 91331, USA, http://cprall.com/ |
| California | E1925 | WWW SIMPLE FAST FUN COM | 10944 VENTURA BLVD FL 2 2,STUDIO CITY,CA 91604 | https://www.cheapfastfun.com/contact.php | — | Simple and Fun Online, 10944 Ventura Blvd, Studio City, CA 91604, USA, http://www.simpleandfunonline.com/contact.php |
| California | E1988 | WWW TRAFFIC101 COM | 14549 VICTORY BLVD STE 202,VAN NUYS,CA 91411 | http://www.5dollartrafficschool.com/ | — | 5 Dollar Traffic School, 14549 Victory Blvd Ste 200, Van Nuys, CA 91411, USA, http://www.5dollartrafficschool.com/ |
| California | E8085 | SALINAS TRAFFIC SCHOOL | 11 W LAUREL DRIVE 235,SALINAS,CA 93906 | http://pcdrivingschool.net/ | — | PC Driving School, 11 W Laurel Dr #235, Salinas, CA 93906, USA, http://pcdrivingschool.net/ |
| California | E8235 | 1 HR OR LESS wwwEasyQuickCoursecom | 211 S MONTCLAIR ST,BAKERSFIELD,CA 93309-3112 | https://www.1hrfix.com/ | — | Easy Quick Course Traffic School, 211 S Montclair St, Bakersfield, CA 93309, USA, https://www.1hrfix.com/; Fast Simple Course Traffic School, 211 S Montclair St, Bakersfield, CA 93309, USA, https://www.1hourfix.com/ |
| California | E8315 | A CAMINO REAL DRIVING AND TRAFFIC | 15022 MULBERRY DR UNIT J,WHITTIER,CA 90604 | https://acaminorealschool.com/ | — | A Camino Real Driving School, 15022 Mulberry Dr Ste j, Whittier, CA 90604, USA, https://acaminorealschool.com/ |
| California | E9559 | 24/7 MR MRS TRAFFIC SCHOOL ESP | 100 SPECTRUM CENTER DR STE 900 RM 956,IRVINE,CA 92618 | http://www.vmdtrafficschool.com/ | — | 24/7 Mr Mrs Traffic School, 100 Spectrum Center Drive suite 956 Irvine Ca `92618, Irvine, CA 92618, USA, http://www.vmdtrafficschool.com/; Mr Mrs Driving School, 100 Spectrum Center Dr, Irvine, CA 92618, USA |
| California | E9562 | FINISHTRAFFICSCHOOLTODAY COM | 2160 FLETCHER PKWY STE 109,EL CAJON,CA 92020 | https://finishtodaytrafficschool.com/index.cfm?fuseaction=Main.showContact | — | Easy Traffic School, 2160 Fletcher Pkwy Ste 104, El Cajon, CA 92020, USA, https://www.easytrafficschool.com/; Los Angeles Traffic School, 2160 Fletcher Pkwy Ste 112, El Cajon, CA 92020, USA, http://losangelestrafficschool.com/; Traffic Tutors, 2160 Fletcher Pkwy, El Cajon, CA 92020, USA, https://courtticket.com/contact/ |
| California | E9632 | /FREE CERTIFICATE/ www1HRcoursecom | 1412 17TH ST STE 314,BAKERSFIELD,CA 93301-5227 | https://www.1hourfix.com/ | — | 1412 17th St Ste 314, 1412 17th St Ste 314, Bakersfield, CA 93301, USA |
| California | E9634 | FAST CERTIFICATE www1HourCoursecom | 1412 17TH ST STE 203,BAKERSFIELD,CA 93301 | https://www.1hourfix.com/ | — | Easy Quick Traffic School, 1412 17th St Ste 347, Bakersfield, CA 93301, USA, https://easyquicktrafficschool.com/ |
| Georgia | DI000584 | DOUGLAS AREA DRIVER IMPROVEMENT SERVICES | 1408 BAKER HWY W DOUGLAS GA 31533-2112 | https://www.dadis.info/ | — | Douglas Area Driver Improvement, 1408 W Baker Hwy, Douglas, GA 31533, USA, https://www.dadis.info/ |
| Georgia | DI000774 | # 1 A 1 DUI & DEFENSIVE DRIVING SCHOOL (JONESBORO) | 7144 TARA BLVD STE 200A JONESBORO GA 30236-1837 | https://a1drivingschools.com/ | — | A-1 Driving School, 7144 Tara Blvd, Jonesboro, GA 30236, USA, https://a1drivingschools.com/ |
| Georgia | DI000777 | #1 A 1 DUI & DEFENSIVE DRIVING SCHOOL (LAWRENCEVILLE) | 255 LANGLEY DR LAWRENCEVILLE GA 30046-6907 | https://a1drivingschools.com/ | — | A-1 Driving School, 255 Langley Dr, Lawrenceville, GA 30046, USA, https://a1drivingschools.com/; Georgia DUI Schools, 255 Langley Dr, Lawrenceville, GA 30046, USA, https://georgiaduischools.com/ |
| Georgia | DI000777 | # 1 A 1 DUI & DEFENSIVE DRIVING SCHOOL (LAWRENCEVILLE) | 255 LANGLEY DR LAWRENCEVILLE GA 30046-6907 | https://a1drivingschools.com/ | — | A-1 Driving School, 255 Langley Dr, Lawrenceville, GA 30046, USA, https://a1drivingschools.com/; Georgia DUI Schools, 255 Langley Dr, Lawrenceville, GA 30046, USA, https://georgiaduischools.com/ |
| Georgia | DI000809 | A-1/ATHENS DUI & DEFENSIVE DRIVING SCHOOL | 2735 ATLANTA HWY ATHENS GA 30606-3340 | https://a1drivingschools.com/ | — | A-1 Driving School, 2735 Atlanta Hwy, Athens, GA 30606, USA, https://a1drivingschools.com/ |
| Georgia | DI000810 | A-1/ALPHARETTA DUI & DEFENSIVE DRIVING SCHOOL | 12920 HIGHWAY 9 N STE A MILTON GA 30004-3609 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 12920 GA-9, Milton, GA 30004, USA, http://www.a1drivingschools.com/ |
| Georgia | DI000811 | # 1 A 1/DOUGLASVILLE DUI & DEFENSIVE DRIVING SCHOOL | 6239 FAIRBURN RD STE E DOUGLASVILLE GA 30134-6953 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 6239 Fairburn Rd, Douglasville, GA 30134, USA, http://www.a1drivingschools.com/; Dui Defensive Driving Driver's Ed., 6239 Fairburn Rd, Douglasville, GA 30134, USA |
| Georgia | DI000818 | # 1 A 1/I-85/CHESHIRE DUI & DEFENSIVE DRIVING SCHOOL | 2000 CHESHIRE BRIDGE RD NE STE D ATLANTA GA 30324-4273 | https://a1drivingschools.com/ | — | A-1 Driving School, 2000 Cheshire Bridge Rd NE # D, Atlanta, GA 30324, USA, https://a1drivingschools.com/; Georgia DUI Schools, 2000 Cheshire Bridge Rd NE, Atlanta, GA 30324, USA, https://georgiaduischools.com/ |
| Georgia | DI000819 | A-1/I-285/MEMORIAL DRIVE DUI & DEFENSIVE DRIVING SCHOOL | 4712 MEMORIAL DR STE D DECATUR GA 30032-1446 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 4712 Memorial Dr, Decatur, GA 30032, USA, http://www.a1drivingschools.com/; Georgia DUI Schools, 4712 Memorial Dr, Decatur, GA 30032, USA, https://georgiaduischools.com/ |
| Georgia | DI000822 | # 1 A 1/I-285/JONESBORO ROAD DUI & DEFENSIVE DRIVING SCHOOL | 4621 JONESBORO RD FOREST PARK GA 30297-3544 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 4621 Jonesboro Rd, Forest Park, GA 30297, USA, http://www.a1drivingschools.com/; DUI Defensive Driving School, 4621 Jonesboro Rd, Forest Park, GA 30297, USA |
| Georgia | DI000897 | # 1 A 1/SNELLVILLE DUI & DEFENSIVE DRIVING SCHOOL | 2376 LENORA CHURCH RD SNELLVILLE GA 30078-3233 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 2376 Lenora Church Rd, Snellville, GA 30078, USA, http://www.a1drivingschools.com/ |
| Georgia | DI000920 | # 1 A 1/CONYERS DUI & DEFENSIVE DRIVING SCHOOL | 1040 E FREEWAY DR SE CONYERS GA 30094-5965 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 1040 E Freeway Dr SE, Conyers, GA 30094, USA, http://www.a1drivingschools.com/ |
| Georgia | DI000933 | DOUGHERTY COUNTY DUI & DEFENSIVE DRIVING SCHOOL | 207 CEDRIC ST LEESBURG GA 31763-4952 | https://www.provisionduischool.com/ | — | DOCO Driving School, Inc., 207 Cedric St, Leesburg, GA 31763, USA, http://www.docodrivingschool.com/ |
| Georgia | DI002020 | BEST CHOICE DRIVER IMPROVEMENT CLINIC | 610 RIDLEY AVE LAGRANGE GA 30240-2236 | https://bestchoiceduischool.com/ | — | Best Choice Dui School, 610 Ridley Ave, LaGrange, GA 30240, USA, https://bestchoiceduischool.com/ |
| Georgia | DI002043 | # 1 A 1/GAINESVILLE DUI & DEFENSIVE DRIVING SCHOOL | 644 JESSE JEWELL PKWY SW GAINESVILLE GA 30501-4208 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 644 Jesse Jewell Pkwy, Gainesville, GA 30501, USA, http://www.a1drivingschools.com/; Georgia DUI Schools, 644 Jesse Jewell Pkwy, Gainesville, GA 30501, USA, https://georgiaduischools.com/ |
| Georgia | DI002112 | ATLANTA AREA DUI AND DRIVING SCHOOL, LLC | 3845 N DRUID HILLS RD STE 106 DECATUR GA 30033-3021 | https://www.atlantaareadrivingschool.com/ | — | #1 (Atlanta Area) Driving & DUI School, 3845 N Druid Hills Rd #106, Decatur, GA 30033, USA, https://www.atlantaareadrivingschool.com/ |
| Georgia | DI002112 | ATLANTA AREA DUI AND DRIVING SCHOOL LLC | 3845 N DRUID HILLS RD STE 106 DECATUR GA 30033-3021 | https://www.atlantaareadrivingschool.com/ | — | #1 (Atlanta Area) Driving & DUI School, 3845 N Druid Hills Rd #106, Decatur, GA 30033, USA, https://www.atlantaareadrivingschool.com/ |
| Georgia | DI002138 | # 1 A 1/JOHNS CREEK DUI & DEFENSIVE DRIVING SCHOOL | 5805 STATE BRIDGE RD STE V JOHNS CREEK GA 30097-6427 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 5805 State Bridge Rd V, Johns Creek, GA 30097, USA, http://www.a1drivingschools.com/; Georgia DUI Schools, 5805 State Bridge Rd V, Johns Creek, GA 30097, USA, https://georgiaduischools.com/ |
| Georgia | DI002150 | A 1 DUI & DEFENSIVE DRIVING SCHOOL BUFORD | 4450 NELSON BROGDON BLVD STE A7 SUGAR HILL GA 30518-3450 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 4450 Nelson Brogdon Blvd # A7, Sugar Hill, GA 30518, USA, http://www.a1drivingschools.com/ |
| Georgia | DI002186 | A A AFFORDABLE EASTLAKE DUI AND DEFENSIVE DRIVING SCHOOL | 3024 MEMORIAL DR SE STE C ATLANTA GA 30317-3517 | http://aeduischool.com/ | — | A A Affordable Eastlake DUI & Defensive Driving School, 3024 Memorial Dr SE C, Atlanta, GA 30317, USA, http://aeduischool.com/ |
| Georgia | DI002202 | # 1 A 1/KENNESAW DUI & DEFENSIVE DRIVING SCHOOL | 3600 CHEROKEE ST NW STE 122 KENNESAW GA 30144-2027 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 3600 Cherokee St NW #122nd, Kennesaw, GA 30144, USA, http://www.a1drivingschools.com/ |
| Georgia | DI002207 | #1 ATLANTA'S KNOW MORE DUI SCHOOL, LLC | 576 FAIRVIEW RD STE A STOCKBRIDGE GA 30281-0979 | https://www.atlantaareadrivingschool.com/ | — | Know More DUI School, 576A Fairview Rd, Stockbridge, GA 30281, USA |
| Georgia | DI002208 | STOP DEFENSIVE DRIVING & DUI #2 | 17 COACH LEE HILL BLVD STATESBORO GA 30458-2182 | https://1stopdriving.com/ | — | 1 Stop Driving, 17 Coach Lee Hl Blvd, Statesboro, GA 30458, USA, http://1stopdriving.com/ |
| Georgia | DI002229 | # 1 A 1/EAST POINT DUI & DEFENSIVE DRIVING SCHOOL | 1613 WHITE WAY EAST POINT GA 30344-3317 | http://www.a1drivingschools.com/ | — | A-1 Driving School, 1613 White Way, East Point, GA 30344, USA, http://www.a1drivingschools.com/ |
| Georgia | DI002243 | A-1 DUI & DEFENSIVE DRIVING SCHOOL - SANDY SPRINGS | 211 HILDERBRAND DR SANDY SPRINGS GA 30328-3807 | https://www.a1drivingschools.com/ | — | A-1 Driving School, 211 Hilderbrand Dr, Sandy Springs, GA 30328, USA, https://www.a1drivingschools.com/ |
| Georgia | DI002256 | WINGS DUI & RISK REDUCTION SCHOOL, LLC | 2850 GA HIGHWAY 85 E BLDG A MANCHESTER GA 31816-5952 | https://2wingsduischool.com/contact-us/ | — | Joshua’s Law Drivers Education - 2 Wings DUI School, 2850 GA-85, Manchester, GA 31816, USA, https://2wingsduischool.com/contact-us/ |
| Georgia | DI002260 | A-1 DUI & DEFENSIVE DRIVING SCHOOL - RIVERDALE | 723 HIGHWAY 138 SW STE A RIVERDALE GA 30274-3966 | https://www.a1drivingschools.com/ | — | A-1 Driving School, 723 GA-138, Riverdale, GA 30274, USA, https://www.a1drivingschools.com/ |
| Georgia | DI002272 | A DRIVERS TRAINING SCHOOL | 800 W OGLETHORPE BLVD ALBANY GA 31701-2720 | https://americandefensivedrivingschool.com/ | — | Provision DUI Treatment, LLC, 800 W Oglethorpe Blvd, Albany, GA 31701, USA, https://www.provisionduischool.com/ |
| Georgia | DI002373 | C&L DUI, LLC | 2140 MCGEE RD STE C145 SNELLVILLE GA 30078-2984 | https://www.aglcduischool.com/?utm_campaign=gmb | — | MSincos Auto Broker, 2140 McGee Rd SW Suite C-510, Snellville, GA 30078, USA, http://www.msincosauto.com/ |
| Georgia | DI002374 | WINGS DUI & RISK REDUCTION SCHOOL V, LLC | 309 E MAIN ST THOMASTON GA 30286-3898 | https://2wingsduischool.com/contact-us/ | — | Upson Dui, 309 E Main St, Thomaston, GA 30286, USA, http://www.2wingsduischool.com/ |
| New York | NY-PIRP | National Traffic Safety Institute (NTSI) | 2351 Hylan Blvd, 2nd floor Staten Island, NY 10306 1-800-733-6874 | https://ntsi.com/new-york/ | — | National Traffic Safety Institute, 2351 Hylan Blvd, Staten Island, NY 10306, USA, https://ntsi.com/new-york/ |
| New York | NY-PIRP | AAAA Online Defensive Driving Course by IMPROV | 445 Hamilton Avenue, Suite 1102 White Plains, NY 10601 1-800-660-8908 | https://www.myimprov.com/defensive-driving/new-york/ | — | 445 Hamilton Ave #1102, 445 Hamilton Ave #1102, White Plains, NY 10601, USA |
| New York | NY-PIRP | New York Safety Program (NYSP) | 8302 5th Avenue Brooklyn, NY 11209 1-888-292-0397 | https://nysp.com/ | — | New York Safety Program, 8302 5th Ave, Brooklyn, NY 11209, USA, http://www.nysp.com/ |
| Texas | 002-901-001 | ANDREWS ISD | 405 NW 3RD STREET, ANDREWS, TX, 79714 | http://www.andrews.esc18.net/ | — | Andrews Independent School District, 405 NW 3rd St, Andrews, TX 79714, USA, http://www.andrews.esc18.net/ |
| Texas | 003-902-001 | HUDSON ISD | 6735 TED TROUT DR, LUFKIN, TX, 75904 | http://hhs.hudsonisd.org/ | — | 6735 Ted Trout Dr, 6735 Ted Trout Dr, Lufkin, TX 75904, USA |
| Texas | 011-901-000 | BASTROP ISD | 906 FARM STREET, BASTROP, TX, 78602 | https://drivingschool4me.com/ | — | Bastrop Independent School District, 906 Farm St, Bastrop, TX 78602, USA, http://www.bisdtx.org/ |
| Texas | 013-905-001 | SKIDMORE-TYNAN ISD | 213 W WALTON, SKIDMORE, TX, 78389 | http://www.stbobcats.net/ | — | Skidmore-Tynan High School, 213 W Walton St, Skidmore, TX 78389, USA, http://www.stbobcats.net/ |
| Texas | 015-907-000 | SAN ANTONIO ISD | 141 LAVACA, SAN ANTONIO, TX, 78210 | https://www.texasdrivingschool.net/ | — | 141 Lavaca St Parking, 141 Lavaca St, San Antonio, TX 78210, USA, https://www.loopnet.com/property/141-lavaca-st-san-antonio-tx-78210/48029-138150040010/ |
| Texas | 015-912-001 | SOUTHWEST ISD | 11914 DRAGON LANE, SAN ANTONIO, TX, 78252 | https://www.swisd.net/apps/pages/index.jsp?uREC_ID=2709408&type=d | — | 11914 Dragon Ln, 11914 Dragon Ln, San Antonio, TX 78252, USA |
| Texas | 019-902-002 | HOOKS ISD | 100 EAST 5TH STREET, HOOKS, TX, 75561 | http://hooksisd.net/ | — | 100 E 5th St, 100 E 5th St, Hooks, TX 75561, USA |
| Texas | 019-906-001 | REDWATER ISD | 120 RED RIVER RD NORTH, REDWATER, TX, 75501 | http://www.redwaterisd.org/ | — | 120 Red River Rd N, 120 Red River Rd N, Texarkana, TX 75501, USA |
| Texas | 019-907-103 | TEXARKANA ISD | 4241 SUMMERHILL RD, TEXARKANA, TX, 75503 | http://www.txkisd.net/ | — | Texarkana Independent School District, 4241 Summerhill Rd, Texarkana, TX 75503, USA, http://www.txkisd.net/ |
| Texas | 019-908-000 | LIBERTY-EYLAU ISD | 2901 LEOPARD DRIVE, TEXARKANA, TX, 75501 | https://www.leisd.net/ | — | 2901 Leopard Dr, 2901 Leopard Dr, Texarkana, TX 75501, USA; 2901 Leopard Dr, 2901 Leopard Dr, Texarkana, TX 75501, USA |
| Texas | 019-912-041 | PLEASANT GROVE ISD | 8500 NORTH KINGS HWY, TEXARKANA, TX, 75503 | http://www.pgisd.net/ | — | Pleasant Grove Independent School District, 8500 N Kings Hwy, Texarkana, TX 75503, USA, http://www.pgisd.net/ |
| Texas | 027-904-001 | MARBLE FALLS ISD | 2101 MUSTANG DRIVE, MARBLE FALLS, TX, 78654 | http://dps.texas.gov/ | — | 2101 Mustang Dr, 2101 Mustang Dr, Marble Falls, TX 78654, USA |
| Texas | 028-902-001 | LOCKHART ISD | 906 CENTER ST, LOCKHART, TX, 78644 | https://lockhartdrivingschool.com/ | — | 906 Center St, 906 Center St, Lockhart, TX 78644, USA |
| Texas | 034-903-000 | HUGHES SPRINGS ISD | 609 RUSSELL ST, HUGHES SPRINGS, TX, 75656 | http://www.hsisd.net/ | — | 609 Russell, 609 Russell, Hughes Springs, TX 75656, USA |
| Texas | 034-905-002 | LINDEN-KILDARE CISD | 205 KILDARE ROAD, LINDEN, TX, 75563 | https://www.lkcisd.net/ | — | 205 E Kildare Rd, 205 E Kildare Rd, Linden, TX 75563, USA |
| Texas | 037-901-001 | ALTO ISD | 248 CR 2429, ALTO, TX, 75925 | https://www.alto.esc7.net/ | — | 248 Co Rd 2429, 248 Co Rd 2429, Alto, TX 75925, USA |
| Texas | 037-904-002 | JACKSONVILLE ISD | 945 N JACKSON ST, JACKSONVILLE, TX, 75766-0631 | https://www.jisd.org/apps/pages/index.jsp?type=d&uREC_ID=294697&pREC_ID=680182 | — | 945 N Jackson St, 945 N Jackson St, Jacksonville, TX 75766, USA |
| Texas | 037-907-002 | RUSK ISD | 495 EAGLE DRIVE, RUSK, TX, 75785 | https://www.ruskisd.net/ | — | 495 Eagle Dr, 495 Eagle Dr, Rusk, TX 75785, USA |
| Texas | 038-901-001 | CHILDRESS ISD | 800 AVENUE J NW, CHILDRESS, TX, 79201 | http://www.childressisd.net/ | — | 800 Ave J NW, 800 Ave J NW, Childress, TX 79201, USA |
| Texas | 043-903-001 | CELINA ISD | 3455 N PRESTON ROAD, CELINA, TX, 75009 | http://www.prosperdrivingschool.net/ | — | 3455 N Preston Rd, 3455 N Preston Rd, Celina, TX 75009, USA |
| Texas | 043-912-001 | PROSPER ISD | 301 EAGLE DRIVE, PROSPER, TX, 75078 | http://www.prosperdrivingschool.net/ | — | 301 Eagle Dr, 301 Eagle Dr, Prosper, TX 75078, USA |
| Texas | 044-902-001 | WELLINGTON ISD | 812 15TH STREET, WELLINGTON, TX, 79095-3698 | http://www.wellingtonisd.net/ | — | 812 15th St, 812 15th St, Wellington, TX 79095, USA |
| Texas | 052-901-000 | CRANE ISD | 500 WEST 8TH STREET, CRANE, TX, 79731 | https://www.craneisd.com/ | — | 500 W 8th St, 500 W 8th St, Crane, TX 79731, USA |
| Texas | 053-001-001 | CROCKETT COUNTY CCSD | 797 AVENUE D, OZONA, TX, 76943 | http://www.ozonaschools.net/ | — | CROCKETT COUNTY CONSOLIDATED COMMON SCHOOL DISTRICT, 797 Ave D, Ozona, TX 76943, USA, http://www.ozonaschools.net/ |
| Texas | 054-903-001 | RALLS ISD | 810 AVE I, RALLS, TX, 79357 | https://www.rallsisd.org/ | — | 810 Ave I, 810 Ave I, Ralls, TX 79357, USA |
| Texas | 057-910-009 | GRAND PRAIRIE ISD | 1105 NORTH CARRIER DRIVE, GRAND PRAIRIE, TX, 75050 | http://www.streetwisedrivingschools.com/ | — | 1105 N Carrier Pkwy, 1105 N Carrier Pkwy, Grand Prairie, TX 75050, USA |
| Texas | 058-906-001 | LAMESA ISD | 600 N 14TH, LAMESA, TX, 79331 | http://www.lamesaisd.net/ | — | 600 N 14th St, 600 N 14th St, Lamesa, TX 79331, USA |
| Texas | 059-901-000 | HEREFORD ISD | 200 AVE F, HEREFORD, TX, 79045 | https://hereforddrivingacademy.com/ | — | 200 Ave F, 200 Ave F, Hereford, TX 79045, USA |
| Texas | 060-902-001 | COOPER ISD | 823 FM 1528, COOPER, TX, 75432 | https://www.myimprov.com/defensive-driving/texas/tx-online-course/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | 823 FM1528, 823 FM1528, Cooper, TX 75432, USA |
| Texas | 061-902-000 | LEWISVILLE ISD | 701 S CHARLES ST, LEWISVILLE, TX, 75057 | http://www.onewaydrivingschool.com/ | — | 701 S Charles St, 701 S Charles St, Lewisville, TX 75057, USA |
| Texas | 061-914-001 | LITTLE ELM ISD | 1900 WALKER LANE, LITTLE ELM, TX, 75068 | http://www.yourfirstdrive.com/ | — | 1900 Walker Ln, 1900 Walker Ln, Little Elm, TX 75068, USA |
| Texas | 062-903-001 | YOAKUM ISD | 315 E GONZALES STREET, YOAKUM, TX, 77995 | http://www.yoakumisd.net/ | — | 315 E Gonzales St, 315 E Gonzales St, Yoakum, TX 77995, USA |
| Texas | 070-909-000 | MILFORD ISD | 205 3RD AVENUE, MILFORD, TX, 76670 | http://www.midlothiandrivingschool.net/ | — | 205 3rd Ave, 205 3rd Ave, Milford, TX 76670, USA |
| Texas | 073-903-001 | MARLIN ISD | 1400 CAPPS STREET, MARLIN, TX, 76661 | http://marlinisd.org/ | — | 1400 Capps St, 1400 Capps St, Marlin, TX 76661, USA |
| Texas | 081-902-002 | FAIRFIELD ISD | 631 POST OAK ROAD, FAIRFIELD, TX, 75840-2005 | https://www.fairfieldisd.net/12461_1 | — | 631 Post Oak Rd, 631 Post Oak Rd, Fairfield, TX 75840, USA |
| Texas | 081-904-001 | TEAGUE ISD | 420 N 10TH, TEAGUE, TX, 75860 | https://www.teagueisd.org/ | — | 420 N 10th St, 420 N 10th St, Teague, TX 75860, USA |
| Texas | 081-905-000 | WORTHAM ISD | 200 S 5TH STREET, WORTHAM, TX, 76693 | http://worthamisd.org/ | — | 200 S 5th St, 200 S 5th St, Wortham, TX 76693, USA |
| Texas | 083-901-001 | SEAGRAVES ISD | 1300 16TH STREET, SEAGRAVES, TX, 79359 | https://www.seagravesisd.net/ | — | 1300 16th St, 1300 16th St, Seagraves, TX 79359, USA |
| Texas | 084-904-001 | LAMARQUE | 397 DUROUX, LAMARQUE, TX, 77568 | https://www.southregiondriving.com/texas-city | — | 397 Duroux Rd, 397 Duroux Rd, La Marque, TX 77568, USA |
| Texas | 085-902-001 | POST ISD | 307 W 4TH STREET, POST, TX, 79356 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | 307 W 4th St, 307 W 4th St, Post, TX 79356, USA |
| Texas | 090-904-001 | PAMPA ISD | 111 E HARVESTER, PAMPA, TX, 79065 | http://www.pampaisd.net/ | — | 111 E Harvester Ave, 111 E Harvester Ave, Pampa, TX 79065, USA |
| Texas | 091-822-004 | EAGLE MOUNTAIN-SAGINAW ISD | 800 N BLUE MOUND RD, SAGINAW, TX, 76131 | http://www.emsisd.com/ | — | 800 N Blue Mound Rd, 800 N Blue Mound Rd, Saginaw, TX 76131, USA |
| Texas | 092-901-001 | GLADEWATER ISD | 2201 WEST GAY AVENUE, GLADEWATER, TX, 75647 | https://texascdlsolutions.com/ | — | 2201 W Gay Ave, 2201 W Gay Ave, Gladewater, TX 75647, USA |
| Texas | 092-908-001 | WHITE OAK ISD | 200 SOUTH WHITE OAK ROAD, WHITE OAK, TX, 75693-1597 | http://www.redoakdrivingschool.com/ | — | 200 S White Oak Rd, 200 S White Oak Rd, White Oak, TX 75693, USA |
| Texas | 095-901-002 | ABERNATHY ISD | 505 7TH ST, ABERNATHY, TX, 79311 | http://hs.abernathyisd.com/ | — | 505 7th St, 505 7th St, Abernathy, TX 79311, USA |
| Texas | 095-905-001 | PLAINVIEW ISD | 1501 QUINCY ST, PLAINVIEW, TX, 79072 | http://starcareertraininginc.com/ | — | 1501 Quincy, 1501 Quincy, Plainview, TX 79072, USA |
| Texas | 096-904-001 | MEMPHIS ISD | 1501 HIGH STREET, MEMPHIS, TX, 79245 | http://www.maxwelldriving.com/ | — | 1501 N High St, 1501 N High St, Memphis, TX 79245, USA |
| Texas | 100-905-000 | HARDIN-JEFFERSON ISD | 3155 HWY 326 SOUTH, SOUR LAKE, TX, 77659 | https://www.hjisd.net/ | — | 3155 TX-326, 3155 TX-326, Sour Lake, TX 77659, USA |
| Texas | 100-907-001 | LUMBERTON ISD | 121 S MAIN, LUMBERTON, TX, 77657 | http://www.lumberton.k12.tx.us/ | — | Lumberton Independent School District, 121 S Main St, Lumberton, TX 77657, USA, http://www.lumberton.k12.tx.us/ |
| Texas | 102-904-002 | HALLSVILLE ISD | 616 CAL YOUNG ROAD, HALLSVILLE, TX, 75650 | http://www.aplusdd.com/ | — | 616 Cal Young Rd, 616 Cal Young Rd, Hallsville, TX 75650, USA |
| Texas | 104-901-000 | HASKELL CONSOLIDATED ISD | 605 N AVENUE E, HASKELL, TX, 79521 | http://www.haskell.esc14.net/ | — | 605 N Ave E, 605 N Ave E, Haskell, TX 79521, USA |
| Texas | 104-903-000 | RULE ISD | 1100 UNION AVE, RULE, TX, 79547 | https://www.rule.esc14.net/ | — | Rule Independent School District, 1100 Union Ave, Rule, TX 79547, USA, https://www.rule.esc14.net/ |
| Texas | 105-501-000 | TEXAS STATE UNIVERSITY | 1202 DEBBIE CT, SAN MARCOS, TX, 78666 | http://www.txst.edu/ | — | 1202 Debbie Ct, 1202 Debbie Ct, San Marcos, TX 78666, USA |
| Texas | 109-904-001 | HILLSBORO ISD | 1600 ABBOTT AVE, HILLSBORO, TX, 76645 | http://hillsboroisd.org/ | — | 1600 Abbott Ave, 1600 Abbott Ave, Hillsboro, TX 76645, USA |
| Texas | 110-901-000 | ANTON ISD | 100 ELLWOOD BLVD, ANTON, TX, 79313 | https://www.antonisd.org/page/elementary | — | 100 E Ellwood Blvd, 100 E Ellwood Blvd, Anton, TX 79313, USA |
| Texas | 111-901-001 | GRANBURY ISD | 217 NORTH JONES STREET, GRANBURY, TX, 76048-2030 | http://www.maverickdrivingacademy.com/ | — | 217 N Jones St, 217 N Jones St, Granbury, TX 76048, USA |
| Texas | 111-902-000 | LIPAN ISD | 211 N KICKAPOO ST, LIPAN, TX, 76462 | http://www.lipanindians.net/ | — | 211 N Kickapoo St, 211 N Kickapoo St, Lipan, TX 76462, USA |
| Texas | 112-906-000 | NORTH HOPKINS ISD | 1994 FM 71 WEST, SULPHUR SPRINGS, TX, 75482-9742 | http://northhopkins.net/ | — | 1994 Farm to Market 71 W, 1994 Farm to Market 71 W, Sulphur Springs, TX 75482, USA |
| Texas | 112-907-000 | MILLER GROVE ISD | 7819 FM 275 SOUTH, CUMBY, TX, 75433 | http://www.mgisd.net/ | — | Miller Grove Independent School District, 7819 Farm Rd 275 S, Cumby, TX 75433, USA, http://www.mgisd.net/ |
| Texas | 114-901-001 | BIG SPRING ISD | 707 E 11TH PLACE, BIG SPRING, TX, 79720 | https://www.bsisd.esc18.net/ | — | 707 E 11th Pl, 707 E 11th Pl, Big Spring, TX 79720, USA |
| Texas | 116-909-001 | WOLFE CITY ISD | 8537 CR 4902, WOLFE CITY, TX, 75496-2037 | https://www.wcisd.net/page/gym-locations | — | 8537 Co Rd 4902, 8537 Co Rd 4902, Wolfe City, TX 75496, USA |
| Texas | 117-901-001 | BORGER ISD | 600 WEST 1ST, BORGER, TX, 79007 | http://www.borgerisd.net/ | — | 600 W 1st St, 600 W 1st St, Borger, TX 79007, USA |
| Texas | 117-904-001 | PLEMONS-STINNETT-PHILLIPS CISD | 603 S MAIN, STINNETT, TX, 79083 | https://www.pspcisd.net/ | — | Plemons-Stinnett-Phillips, 603 Main St, Stinnett, TX 79083, USA, https://www.pspcisd.net/ |
| Texas | 119-902-001 | JACKSBORO ISD | 812 W BELKNAP STREET, JACKSBORO, TX, 76458 | http://www.jacksboroisd.net/ | — | 812 W Belknap St, 812 W Belknap St, Jacksboro, TX 76458, USA |
| Texas | 121-905-000 | KIRBYVILLE CISD | 302 PINE STREET, KIRBYVILLE, TX, 75956 | https://www.kirbyvillecisd.org/ | — | 302 E Pine St, 302 E Pine St, Kirbyville, TX 75956, USA |
| Texas | 122-901-000 | FORT DAVIS ISD | 400 WEBSTER, FORT DAVIS, TX, 79734 | http://www.fdisd.com/ | — | 400 Webster Ave, 400 Webster Ave, Fort Davis, TX 79734, USA |
| Texas | 123-910-008 | BEAUMONT ISD | 8750 PHELAN BLVD, BEAUMONT, TX, 77706-5199 | https://www.driveredtogo.com/DrivingSchool/School-Triangle-Driving-II364.aspx | — | 8750 Phelan Blvd, 8750 Phelan Blvd, Beaumont, TX 77706, USA |
| Texas | 126-901-001 | ALVARADO ISD | 1301 SOUTH PARKWAY, ALVARADO, TX, 76009 | https://www.alvaradoisd.net/ | — | 1301 S Pkwy Dr, 1301 S Pkwy Dr, Alvarado, TX 76009, USA |
| Texas | 126-902-000 | BURLESON ISD | 525 SW JOHNSON AVENUE, BURLESON, TX, 76028 | http://www.burlesondriving.com/ | — | 525 SW Johnson Ave, 525 SW Johnson Ave, Burleson, TX 76028, USA |
| Texas | 127-904-000 | HAWLEY ISD | 800 1ST STREET, HAWLEY, TX, 79525 | https://www.hawley.esc14.net/ | — | Hawley Elementary School, 800 1st St, Hawley, TX 79525, USA, https://www.hawley.esc14.net/; Hawley High School, 800 1st St, Hawley, TX 79525, USA, https://www.hawley.esc14.net/; Hawley High School Football Field, 800 1st St, Hawley, TX 79525, USA, http://www.hawley.esc14.net/ |
| Texas | 129-902-001 | FORNEY ISD | 600 S BOIS D'ARC, FORNEY, TX, 75126 | https://www.rtdrivingacademy.com/ | — | 600 S Bois D'Arc St, 600 S Bois D'Arc St, Forney, TX 75126, USA |
| Texas | 129-906-002 | TERRELL ISD | 400 POETRY ROAD, TERRELL, TX, 75160-9786 | http://www.majorleaguedriving.com/ | — | 400 Poetry Rd, 400 Poetry Rd, Terrell, TX 75160, USA |
| Texas | 135-001-000 | GUTHRIE COMMON SD | 301 JAGUAR LANE, GUTHRIE, TX, 79236 | https://www.guthriejags.com/ | — | Guthrie Common School District, 301 Jaguar Ln, Guthrie, TX 79236, USA, https://www.guthriejags.com/ |
| Texas | 138-903-001 | MUNDAY CISD | 811 WEST D, MUNDAY, TX, 76371 | https://www.mundaycisd.net/21521_1 | — | 811 W D St, 811 W D St, Munday, TX 76371, USA |
| Texas | 139-905-000 | CHISUM ISD | 2800 CHURCH ST, PARIS, TX, 75462 | https://chs.chisumisd.org/ | — | 2800 S Church St, 2800 S Church St, Paris, TX 75462, USA |
| Texas | 139-912-000 | PRAIRILAND ISD | 466 FM 196 S, PATTONVILLE, TX, 75468 | http://www.prairiland.net/ | — | 466 FM 196, 466 FM 196, Pattonville, TX 75468, USA |
| Texas | 140-904-001 | LITTLEFIELD ISD | 1230 W WAYLON JENNINGS BLVD, LITTLEFIELD, TX, 79339 | https://www.tditds.com/ | — | 1230 W Waylon Jennings Blvd, 1230 W Waylon Jennings Blvd, Littlefield, TX 79339, USA |
| Texas | 140-907-001 | SPRINGLAKE-EARTH ISD | 472 FM 302, EARTH, TX, 79031 | http://www.springlake-earth.org/ | — | Springlake-Earth High School, 472 FM302, Earth, TX 79031, USA, http://www.springlake-earth.org/ |
| Texas | 141-901-001 | LAMPASAS ISD | 2716 HWY 281, LAMPASAS, TX, 76550 | https://www.lisdtx.org/ | — | 2716 Hwy 281, 2716 Hwy 281, Lampasas, TX 76550, USA |
| Texas | 144-902-000 | LEXINGTON ISD | 8731 NORTH HWY 77, LEXINGTON, TX, 78947 | http://www.lexingtonisd.net/ | — | N Highway, N Highway, 8731 US-77, Lexington, TX 78947, USA |
| Texas | 146-902-002 | DAYTON ISD | 3200 N CLEVELAND HWY, DAYTON, TX, 77535 | http://daytonisd.net/ | — | 3200 N Cleveland St, 3200 N Cleveland St, Dayton, TX 77535, USA |
| Texas | 147-902-001 | GROESBECK ISD | 1202 N ELLIS, GROESBECK, TX, 76642-1899 | https://www.groesbeckisd.net/page/transportation-department | — | 1202 N Ellis St, 1202 N Ellis St, Groesbeck, TX 76642, USA |
| Texas | 152-902-000 | NEW DEAL ISD | 209 S AUBURN, NEW DEAL, TX, 79350 | https://www.ndisd.net/ | — | 209 S Auburn Ave, 209 S Auburn Ave, New Deal, TX 79350, USA |
| Texas | 152-903-001 | SLATON ISD | 105 N 20TH STREET, SLATON, TX, 79364-4196 | https://www.slatonisd.net/47860_1 | — | 105 N 20th St, 105 N 20th St, Slaton, TX 79364, USA |
| Texas | 152-908-000 | ROOSEVELT ISD | 1406 CR 3300, LUBBOCK, TX, 79403 | http://www.roosevelt.k12.tx.us/ | — | 1406 C R 3300, 1406 C R 3300, Lubbock, TX 79403, USA |
| Texas | 152-909-001 | SHALLOWATER ISD | 1100 AVE K, SHALLOWATER, TX, 79363-5768 | http://www.shallowaterisd.net/ | — | 1100 Avenue K, 1100 Avenue K, Shallowater, TX 79363, USA |
| Texas | 155-901-000 | JEFFERSON ISD | 1 BULLDOG DR, JEFFERSON, TX, 75657 | http://www.jeffersonisd.org/ | — | 1 Bulldog Dr, 1 Bulldog Dr, Jefferson, TX 75657, USA |
| Texas | 156-902-001 | STANTON ISD | 705 KOONCE ST, STANTON, TX, 79782-0730 | http://www.stanton.esc18.net/ | — | 705 Koonce St, 705 Koonce St, Stanton, TX 79782, USA |
| Texas | 161-908-002 | MART ISD | 700 NAVARRO AVE, MART, TX, 76664 | http://www.martisd.org/ | — | 700 E Navarro St, 700 E Navarro St, Mart, TX 76664, USA |
| Texas | 161-909-001 | MCGREGOR ISD | 903 BLUEBONNET PKWY, MCGREGOR, TX, 76657 | http://www.mcgregor-isd.org/ | — | 903 Bluebonnet Pkwy, 903 Bluebonnet Pkwy, McGregor, TX 76657, USA |
| Texas | 161-910-000 | MOODY ISD | 107 CORA LEE LANE, MOODY, TX, 76557 | http://www.bellcountyschoolofdefensivedriving.com/ | — | 107 Cora Lee Ln, 107 Cora Lee Ln, Moody, TX 76557, USA |
| Texas | 161-918-001 | AXTELL ISD | 308 OTTAWA, AXTELL, TX, 76624 | http://www.axtellisd.net/ | — | 308 Ottawa, 308 Ottawa, Axtell, TX 76624, USA |
| Texas | 163-901-001 | DEVINE ISD | 605 W HONDO AVE, DEVINE, TX, 78016 | https://lonestardrivingacademy.com/ | — | 605 W Hondo Ave, 605 W Hondo Ave, Devine, TX 78016, USA |
| Texas | 165-901-000 | MIDLAND ISD | 3500 NEELY AVE, MIDLAND, TX, 79707 | http://www.freemealdefensivedriving.com/ | — | 3500 Neely Ave, 3500 Neely Ave, Midland, TX 79707, USA |
| Texas | 166-907-000 | BUCKHOLTS ISD | 203 S 10TH ST, BUCKHOLTS, TX, 76518 | https://www.buckholtsisd.net/ | — | 203 S 10th St, 203 S 10th St, Buckholts, TX 76518, USA |
| Texas | 167-901-000 | GOLDTHWAITE ISD | 1509 HANNAH VALLEY RD, GOLDTHWAITE, TX, 76844 | https://www.millscountytx.gov/page/Texas%20Department%20of%20Public%20Safety | — | Goldthwaite High School, 1509 Hanna Valley Rd, Goldthwaite, TX 76844, USA, https://www.goldisd.net/en-US |
| Texas | 170-903-002 | MONTGOMERY ISD | 22825 HWY 105 WEST, MONTGOMERY, TX, 77356 | https://2cool4drivingschool.com/ | — | 22825 Hwy 105 W, 22825 Hwy 105 W, Montgomery, TX 77356, USA |
| Texas | 170-906-001 | MAGNOLIA ISD | 14250 FM 1488, MAGNOLIA, TX, 77354 | http://magnoliadriversed.com/ | — | 14250 FM 1488, 14250 FM 1488, Magnolia, TX 77354, USA |
| Texas | 172-902-001 | DAINGERFIELD-LONE STAR ISD | 202 TIGER DRIVE, DAINGERFIELD, TX, 75638 | https://www.dlsisd.org/ | — | 202 Tiger Dr, 202 Tiger Dr, Daingerfield, TX 75638, USA |
| Texas | 172-905-002 | PEWITT CISD | 1216 HWY 67 E, OMAHA, TX, 75571-1106 | https://www.pewittcisd.net/ | — | 1216 U.S. Hwy 67, 1216 U.S. Hwy 67, Omaha, TX 75571, USA |
| Texas | 174-908-001 | CENTRAL HEIGHTS ISD | 10317 US HWY 259 N, NACOGDOCHES, TX, 75965 | http://www.centralhts.org/ | — | Central Heights High School, 10317 US-259, Nacogdoches, TX 75965, USA, https://www.centralhts.org/ |
| Texas | 181-906-000 | WEST ORANGE-COVE CISD | 1400 NEWTON, ORANGE, TX, 77630 | https://www.woccisd.net/district/about/administration.jsp | — | West Orange-Stark High School, 1400 Newton St, West Orange, TX 77630, USA, http://hs.woccisd.net/ |
| Texas | 181-907-001 | VIDOR ISD | 120 EAST BOLIVAR ST, VIDOR, TX, 77662 | http://www.vidorisd.org/ | — | 120 E Bolivar St, 120 E Bolivar St, Vidor, TX 77662, USA |
| Texas | 181-908-001 | LITTLE CYPRESS-MAURICEVILLE CISD | 7327 HWY 87 NORTH, ORANGE, TX, 77632 | http://www.lcmcisd.org/ | — | Bear Stadium, Bear Stadium, 7327 TX-87, Orange, TX 77632, USA |
| Texas | 185-901-001 | BOVINA ISD | 500 HALSELL STREET, BOVINA, TX, 79009 | http://bovinaisd.org/ | — | 500 Halsell St, 500 Halsell St, Bovina, TX 79009, USA |
| Texas | 185-902-001 | FARWELL ISD | 801 AVENUE G, FARWELL, TX, 79325 | http://www.farwellschools.org/ | — | 801 Ave G S, 801 Ave G S, Farwell, TX 79325, USA |
| Texas | 186-902-001 | FORT STOCKTON ISD | 1200 W 17TH, FORT STOCKTON, TX, 79735 | http://www.fsisd.net/ | — | Fort Stockton High School, 1200 W 17th St, Fort Stockton, TX 79735, USA, https://www.fsisd.net/ |
| Texas | 189-902-000 | PRESIDIO ISD | 100 MARKET STREET, PRESIDIO, TX, 79845 | http://www.presidio-isd.net/ | — | 100 Market St, 100 Market St, Presidio, TX 79845, USA |
| Texas | 192-901-001 | PLAINVIEW | 1111 12TH STREET, BIGLAKE, TX, 76932-3513 | http://starcareertraininginc.com/ | — | Reagan County High School, 1111 E 12th St, Big Lake, TX 76932, USA, http://www.reagancountyisd.net/; Reagan County Superintendent, 1111 E 12th St, Big Lake, TX 76932, USA |
| Texas | 194-905-000 | DETROIT ISD | 110 E GARNER AVE, DETROIT, TX, 75436 | https://www.detroiteagles.net/ | — | Detroit Elementary School, 110 Garner Dr, Detroit, TX 75436, USA, https://www.detroiteagles.net/ |
| Texas | 195-901-001 | PECOS-BARSTOW-TOYAH ISD | 1201 S PARK, PECOS, TX, 79772-5718 | https://www.pbtisd.net/ | — | 1201 S Park St, 1201 S Park St, Pecos, TX 79772, USA |
| Texas | 196-902-001 | WOODSBORO ISD | 508 KASTEN, WOODSBORO, TX, 78393 | https://www.wisd.net/ | — | 508 Kasten Ave, 508 Kasten Ave, Woodsboro, TX 78393, USA |
| Texas | 198-903-000 | FRANKLIN ISD | 1252 WEST FM 1644, FRANKLIN, TX, 77856 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | 1252 W Farm to Market 1644, 1252 W Farm to Market 1644, Franklin, TX 77856, USA |
| Texas | 201-910-002 | TATUM ISD | 600 CRYSTAL FARMS RD, TATUM, TX, 75691 | http://www.tatumisd.org/ | — | 600 Crystal Farms Rd, 600 Crystal Farms Rd, Tatum, TX 75691, USA |
| Texas | 202-903-000 | HEMPHILL ISD | 1000 MILAM ST, HEMPHILL, TX, 75948 | https://www.hemphillisd.net/ | — | 1000 Milam St, 1000 Milam St, Hemphill, TX 75948, USA |
| Texas | 203-901-002 | SAN AUGUSTINE ISD | 702 N CLARK ST, SAN AUGUSTINE, TX, 75972-1403 | https://www.saisd.us/apps/pages/index.jsp?uREC_ID=2126508&type=d&pREC_ID=2156625&tota11y=true | — | 702 N Clark St, 702 N Clark St, San Augustine, TX 75972, USA |
| Texas | 206-901-000 | SAN SABA ISD | 808 WEST WALLACE, SAN SABA, TX, 76877 | https://www.san-saba.net/ | — | 808 W Wallace St, 808 W Wallace St, San Saba, TX 76877, USA; 808 W Wallace, 808 W Wallace, San Saba, TX 76877, USA |
| Texas | 211-902-001 | STRATFORD ISD | 503 N 8TH, STRATFORD, TX, 79084 | http://www.stratfordisd.net/ | — | 503 N 8th St, 503 N 8th St, Stratford, TX 79084, USA |
| Texas | 213-901-001 | GLEN ROSE ISD | 1102 STADIUM DR, GLEN ROSE, TX, 76043 | https://www.grisd.net/o/grhs | — | 1102 Stadium Dr, 1102 Stadium Dr, Glen Rose, TX 76043, USA |
| Texas | 215-901-001 | BRECKENRIDGE ISD | 500 W LINDSEY ST, BRECKENRIDGE, TX, 76424 | https://www.breckenridgeisd.org/18336_2 | — | 500 W Lindsey St, 500 W Lindsey St, Breckenridge, TX 76424, USA |
| Texas | 220-906-000 | GRAPEVINE-COLLEYVILLE ISD | 736 E NORTHWEST HWY, GRAPEVINE, TX, 76051 | http://www.gcisd.net/ | — | 736 E Northwest Hwy, 736 E Northwest Hwy, Grapevine, TX 76051, USA |
| Texas | 220-914-000 | KENNEDALE ISD | 120 W KENNEDALE PARKWAY, KENNEDALE, TX, 76060 | http://www.kennedaleisd.net/ | — | 120 W Kennedale Pkwy, 120 W Kennedale Pkwy, Kennedale, TX 76060, USA |
| Texas | 220-916-000 | HURST-EULESS-BEDFORD ISD | 1849 CENTRAL DRIVE, BEDFORD, TX, 76022 | https://hebdrivingschool.com/ | — | 1849 Central Dr, 1849 Central Dr, Bedford, TX 76022, USA |
| Texas | 220-917-001 | CASTLEBERRY ISD | 315 CHURCHILL ROAD, FORT WORTH, TX, 76114 | https://www.castleberryisd.net/ | — | 315 Churchill Rd, 315 Churchill Rd, River Oaks, TX 76114, USA |
| Texas | 220-918-001 | EAGLE MOUNTAIN-SAGINAW ISD | 1200 OLD DECATUR ROAD, FT WORTH, TX, 76179 | http://www.emsisd.com/ | — | 1200 Old Decatur Rd, 1200 Old Decatur Rd, Saginaw, TX 76179, USA |
| Texas | 220-919-001 | CARROLL ISD | 1501 WEST SOUTHLAKE BLVD, SOUTHLAKE, TX, 76092 | http://www.carrollwatkinsdrivingschool.com/ | — | 1501 W Southlake Blvd, 1501 W Southlake Blvd, Southlake, TX 76092, USA |
| Texas | 220-920-001 | WHITE SETTLEMENT ISD | 1025 WEST LOOP 820 NORTH, FORT WORTH, TX, 76108 | http://www.wsisd.com/ | — | 1025 W Loop 820 N, 1025 W Loop 820 N, Fort Worth, TX 76108, USA |
| Texas | 221-901-001 | ABILENE ISD | 842 N MOCKINGBIRD, ABILENE, TX, 79603 | http://aokdrivingschool.com/ | — | 842 N Mockingbird Ln, 842 N Mockingbird Ln, Abilene, TX 79603, USA |
| Texas | 221-912-001 | WYLIE ISD | 6249 BUFFALO GAP ROAD, ABILENE, TX, 79606-5509 | https://www.wyliedrivingschool.com/ | — | Wylie Early Childhood Center, 6249 Buffalo Gap Rd, Abilene, TX 79606, USA |
| Texas | 227-622-005 | LONE STAR H S NORTH | 1379 FM 678, GAINESVILLE, TX, 76240 | https://lonestardrivingacademy.com/ | — | Gainesville State School, 1379 FM678, Gainesville, TX 76240, USA, https://www.tjjd.texas.gov/gainesville-state-school-and-supt-darryl-anderson-hitting-positive-milestones/ |
| Texas | 231-901-001 | MCCAMEY ISD | 1107 S BURLESON, MCCAMEY, TX, 79752 | http://www.mcisd.esc18.net/ | — | 1107 S Burleson Ave, 1107 S Burleson Ave, McCamey, TX 79752, USA |
| Texas | 233-901-001 | SAN FELIPE-DEL RIO CISD | 100 MEMORIAL DR, DEL RIO, TX, 78840-2995 | http://www.sfdr-cisd.org/ | — | 100 Memorial Dr, 100 Memorial Dr, Del Rio, TX 78840, USA |
| Texas | 234-903-001 | EDGEWOOD ISD | 804 E PINE ST, EDGEWOOD, TX, 75117-0006 | http://www.edgewood-isd.net/ | — | 804 E Pine St, 804 E Pine St, Edgewood, TX 75117, USA |
| Texas | 237-904-002 | WALLER ISD | 20950 FIELD STORE RD, WALLER, TX, 77484 | http://www.wallerisd.net/ | — | 20950 Field Store Rd, 20950 Field Store Rd, Waller, TX 77484, USA |
| Texas | 242-906-000 | FORT ELLIOTT CISD | 501 EAST WILSON STREET, BRISCOE, TX, 79011-0138 | http://www.fecisd.net/ | — | 501 Wilson Ave, 501 Wilson Ave, Briscoe, TX 79011, USA |
| Texas | 246-904-000 | GEORGETOWN ISD | 603 LAKEWAY DRIVE, GEORGETOWN, TX, 78628 | https://www.patriotdriving.com/ | — | 603 Lakeway Dr, 603 Lakeway Dr, Georgetown, TX 78628, USA |
| Texas | 246-907-001 | JARRELL ISD | 312 N 5TH STREET, JARRELL, TX, 76537 | http://www.jarrellisd.org/ | — | 312 N 5th St, 312 N 5th St, Jarrell, TX 76537, USA |
| Texas | 248-902-001 | WINK-LOVING ISD | 200 ROSEY DODD AVE, WINK, TX, 79789 | https://www.wlisd.net/ | — | Wildcat Stadium, Wildcat Stadium, 200 S Rosey Dodd Ave, Wink, TX 79789, USA; 200 N Rosey Dodd Ave, 200 N Rosey Dodd Ave, Wink, TX 79789, USA |
| Texas | 249-905-001 | DECATUR ISD | 307 S CATES ST, DECATUR, TX, 76234-1970 | https://dps.texas.gov/ | — | 307 S Cates St, 307 S Cates St, Decatur, TX 76234, USA |
| Texas | 251-901-001 | DENVER CITY ISD | 501 MUSTANG AVE, DENVER CITY, TX, 79323-2479 | http://www.dcisd.org/ | — | 501 Mustang Dr, 501 Mustang Dr, Denver City, TX 79323, USA |
| Texas | 252-901-001 | GRAHAM ISD | 1200 BRAZOS, GRAHAM, TX, 76450 | http://www.grahamisd.com/ | — | 1200 Brazos St, 1200 Brazos St, Graham, TX 76450, USA |
| Texas | 252-903-000 | OLNEY ISD | 704 W GROVE, OLNEY, TX, 76374 | https://www.olneyisd.net/ | — | 704 W Grove St, 704 W Grove St, Olney, TX 76374, USA |

## Unconfirmed (1076)

| State | Licence | Name | Address | Current website | Proposed | Why |
|---|---|---|---|---|---|---|
| Arizona | 003 | Arizona Chapter National Safety Council | — | https://www.acnsc.org/ | — | ambiguous: 2 candidates pass (Arizona Chapter National Safety Council Defensive Driving School; Arizona Chapter National Safety Council) |
| Arizona | 003 | Arizona Chapter National Safety Council | — | https://www.acnsc.org/ | — | ambiguous: 2 candidates pass (Arizona Chapter National Safety Council Defensive Driving School; Arizona Chapter National Safety Council) |
| Arizona | 004 | TrafficSchoolOnline.com | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 004 | TrafficSchoolOnline.com | — | http://aztrafficschools.com/ | — | no candidate with the school's name |
| Arizona | 005 | I Drive Safely | — | http://institutefordriverssafety.org | — | no candidate with the school's name |
| Arizona | 005 | I Drive Safely | — | http://institutefordriverssafety.org | — | no candidate with the school's name |
| Arizona | 008 | Arizona Traffic Schools LLC | — | http://aztrafficschools.com/ | — | ambiguous: 3 candidates pass (Arizona Traffic Schools; Arizona Traffic Schools; Arizona Traffic Schools) |
| Arizona | 008 | Arizona Traffic Schools LLC | — | http://aztrafficschools.com/ | — | ambiguous: 3 candidates pass (Arizona Traffic Schools; Arizona Traffic Schools; Arizona Traffic Schools) |
| Arizona | 009 | DrivingUniversity.com | — | https://www.up2speedts.com/ | — | no candidate with the school's name |
| Arizona | 009 | DrivingUniversity.com | — | https://www.up2speedts.com/ | — | no candidate with the school's name |
| Arizona | 011 | National Traffic Safety Institute | — | https://ntsi.com/arizona/ | — | ambiguous: 4 candidates pass (National Traffic Safety Institute; National Institute for Safety Education Broadway Location A NiSE Company; National Institute for Safety Education; National Traffic Safety Institute - Defensive Driving School) |
| Arizona | 011 | National Traffic Safety Institute | — | https://ntsi.com/arizona/ | — | ambiguous: 4 candidates pass (National Traffic Safety Institute; National Institute for Safety Education Broadway Location A NiSE Company; National Institute for Safety Education; National Traffic Safety Institute - Defensive Driving School) |
| Arizona | 013 | Drive Safe AZ Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 013 | Drive Safe AZ Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 015 | An Online Traffic School by The Improv Comedy Club | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 015 | An Online Traffic School by The Improv Comedy Club | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 027 | Traffic 101 | — | http://www.discounttrafficsurvivalschool.com/ | — | proved listing Tss 101 has no website |
| Arizona | 027 | Traffic 101 | — | http://www.discounttrafficsurvivalschool.com/ | — | proved listing Tss 101 has no website |
| Arizona | 031 | GoToTrafficSchool.com | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 031 | GoToTrafficSchool.com | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 034 | American Safety Council | — | https://www.americansafetycouncil.com/ | — | listing American Safety Council, Inc. (ChIJSXW9Fft654gRsTGoSDzS6Q0) was also proved for C2386 AMERICAN SAFETY COUNCIL |
| Arizona | 034 | American Safety Council | — | https://www.americansafetycouncil.com/ | — | listing American Safety Council, Inc. (ChIJSXW9Fft654gRsTGoSDzS6Q0) was also proved for C2386 AMERICAN SAFETY COUNCIL |
| Arizona | 036 | AZ Monsoon Driving School | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | 036 | AZ Monsoon Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 038 | Safe2Drive | — | https://www.safe2drive.com/ | — | listing Safe2Drive (ChIJtbpfnr1c2YAR_caDyBOicTM) was also proved for E1854 SAFE2DRIVE |
| Arizona | 038 | Safe2Drive | — | https://www.safe2drive.com/ | — | listing Safe2Drive (ChIJtbpfnr1c2YAR_caDyBOicTM) was also proved for E1854 SAFE2DRIVE |
| Arizona | 050 | Roadrunner Traffic School | — | https://crossroadstss.com/ | — | no candidate with the school's name |
| Arizona | 050 | Roadrunner Traffic School | — | https://crossroadstss.com/ | — | no candidate with the school's name |
| Arizona | 051 | EZ AZ Defensive Driving | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 051 | EZ AZ Defensive Driving | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 053 | DriversEd.com | — | https://a-zdrivingschool.com/ | — | no candidate with the school's name |
| Arizona | 053 | DriversEd.com | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 054 | National Driving and Traffic School | — | https://ntsi.com/arizona/ | — | no candidate with the school's name |
| Arizona | 054 | National Driving and Traffic School | — | https://ntsi.com/arizona/ | — | no candidate with the school's name |
| Arizona | 055 | Easy - Fast - Cheap Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 055 | Easy - Fast - Cheap Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 060 | Northwest Phx - Peoria Defensive Driving School | — | https://www.ddcaz.org/contactus.htm | — | no candidate with the school's name |
| Arizona | 060 | Northwest Phx - Peoria Defensive Driving School | — | https://www.ddcaz.org/contactus.htm | — | no candidate with the school's name |
| Arizona | 061 | PHX Traffic School | — | https://www.beepbeeptss.com/ | — | no candidate with the school's name |
| Arizona | 061 | PHX Traffic School | — | https://www.beepbeeptss.com/ | — | no candidate with the school's name |
| Arizona | 062 | Tucsons Fun Defensive Driving | — | http://www.tucsonsfunschool.com/ | — | ambiguous: 2 candidates pass (Tucson's Fun Traffic Survival School; Tucson's Fun Traffic Survival) |
| Arizona | 062 | Tucsons Fun Defensive Driving | — | http://www.tucsonsfunschool.com/ | — | ambiguous: 2 candidates pass (Tucson's Fun Traffic Survival School; Tucson's Fun Traffic Survival) |
| Arizona | 066 | Cheap - Easy - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 066 | Cheap - Easy - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 067 | EZ AZ Escuela De Trafico | — | https://www.beepbeeptss.com/ | — | no candidates |
| Arizona | 067 | EZ AZ Escuela De Trafico | — | https://www.beepbeeptss.com/ | — | no candidates |
| Arizona | 070 | Learn And Go Traffic School | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | 070 | Learn And Go Traffic School | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | 071 | Low Cost Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 071 | Low Cost Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 072 | All About Safety Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 072 | All About Safety Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 073 | 123 EZ Ticket Dismissal | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 073 | 123 EZ Ticket Dismissal | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 075 | AZ Defensive Driving by Safe2Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 075 | AZ Defensive Driving by Safe2Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 076 | Arizona's Best Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 076 | Arizona's Best Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 079 | Crash And Learn, LLC | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 079 | Crash And Learn, LLC | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 080 | Payless - Easy - Fun Arizona Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 080 | Payless - Easy - Fun Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 081 | Cheaper - Easier - Faster Arizona Defensive Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 081 | Cheaper - Easier - Faster Arizona Defensive Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 082 | Cheaper - Faster - Easier Arizona Defensive Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 082 | Cheaper - Faster - Easier Arizona Defensive Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 083 | Cheaper - Easy - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 083 | Cheaper - Easy - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 085 | All Over Arizona Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 085 | All Over Arizona Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 086 | Defensive Driving in Arizona by a NiSE Company | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 086 | Defensive Driving in Arizona by a NiSE Company | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 087 | Drop The Ticket Traffic School | — | https://droptheticket.com/ | — | ambiguous: 3 candidates pass (Drop The Ticket Traffic School; Drop The Ticket Defensive Driving School; Drop The Ticket Defensive Driving School) |
| Arizona | 087 | Drop The Ticket Traffic School | — | https://droptheticket.com/ | — | ambiguous: 3 candidates pass (Drop The Ticket Traffic School; Drop The Ticket Defensive Driving School; Drop The Ticket Defensive Driving School) |
| Arizona | 088 | Arizona Training Associates, LLC | — | http://aztrafficschools.com/ | — | no candidate with the school's name |
| Arizona | 088 | Arizona Training Associates, LLC | — | http://aztrafficschools.com/ | — | no candidate with the school's name |
| Arizona | 089 | Defensive Driving School of Arizona | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 089 | Defensive Driving School of Arizona | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 090 | OnlineArizonaDefensiveDriving.com | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 090 | OnlineArizonaDefensiveDriving.com | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 091 | EZ Ticket Buster | — | https://www.beepbeeptss.com/ | — | no candidates |
| Arizona | 091 | EZ Ticket Buster | — | https://www.beepbeeptss.com/ | — | no candidates |
| Arizona | 094 | Traffic Schools of Arizona | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 094 | Traffic Schools of Arizona | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 096 | EZ AZ Approved For All Arizona Courts | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 096 | EZ AZ Approved For All Arizona Courts | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 097 | Dismiss Ticket - Cheap - Easy Fast Defensive Drive | — | https://expressticketdismissal.com/ | — | no candidate with the school's name |
| Arizona | 097 | Dismiss Ticket - Cheap - Easy Fast Defensive Drive | — | https://expressticketdismissal.com/ | — | no candidate with the school's name |
| Arizona | 098 | Payless - Dismiss Ticket - Easy Fast Arizona Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 098 | Payless - Dismiss Ticket - Easy Fast Arizona Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 099 | Pay 4 Less - Simple - Fast Fun Arizona Defensive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 099 | Pay 4 Less - Simple - Fast Fun Arizona Defensive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 401 | Low Cost Quick -N- Easy Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 401 | Low Cost Quick -N- Easy Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 402 | Arizona Traffic Safety Institute LLC | — | http://tssinaz.com/ | — | no candidate with the school's name |
| Arizona | 402 | Arizona Traffic Safety Institute LLC | — | http://tssinaz.com/ | — | no candidate with the school's name |
| Arizona | 405 | Arizona Ticket Dismissal | — | https://expressticketdismissal.com/ | — | no candidate with the school's name |
| Arizona | 405 | Arizona Ticket Dismissal | — | https://expressticketdismissal.com/ | — | no candidate with the school's name |
| Arizona | 406 | Allstate Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 406 | Allstate Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 407 | Arizona's Best Priced Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 407 | Arizona's Best Priced Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 408 | Lose the Ticket Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 408 | Lose the Ticket Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 409 | Arizona Quick Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 409 | Arizona Quick Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 410 | Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 410 | Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 411 | Rush Hour Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 411 | Rush Hour Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 413 | Defensive Driving for Responsible Drivers | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 413 | Defensive Driving for Responsible Drivers | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 414 | Defensive Driving School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 414 | Defensive Driving School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 415 | Super Fly Defensive Driving Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 415 | Super Fly Defensive Driving Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 416 | Defensive Driving and Traffic Safety | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 416 | Defensive Driving and Traffic Safety | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 418 | EZ AZ Defensive Driving Services | — | https://ezazlms.com/contact | — | no candidate with the school's name |
| Arizona | 418 | EZ AZ Defensive Driving Services | — | https://ezazlms.com/contact | — | no candidate with the school's name |
| Arizona | 420 | Certified Defensive Driving School Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 420 | Certified Defensive Driving School Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 421 | Highway Defensive Driving | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 421 | Highway Defensive Driving | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 422 | Super Simple Online Traffic School | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 422 | Super Simple Online Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 423 | Anywhere, Anytime Online Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 423 | Anywhere, Anytime Online Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 424 | Easy Peasy Defensive Driving Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 424 | Easy Peasy Defensive Driving Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 425 | Arizona Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | ambiguous: 2 candidates pass (Defensive Driving Arizona - IMPROV Phoenix; Arizona Traffic Schools) |
| Arizona | 425 | Arizona Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | ambiguous: 2 candidates pass (Defensive Driving Arizona - IMPROV Phoenix; Arizona Traffic Schools) |
| Arizona | 426 | Dismiss That Ticket Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 426 | Dismiss That Ticket Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 427 | Remove That Ticket Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 427 | Remove That Ticket Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 428 | EZ AZ Defensive Driving School | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidates |
| Arizona | 428 | EZ AZ Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidates |
| Arizona | 429 | EZ AZ Traffic Schools | — | https://ezazlms.com/contact | — | no candidate with the school's name |
| Arizona | 429 | EZ AZ Traffic Schools | — | https://ezazlms.com/contact | — | no candidate with the school's name |
| Arizona | 431 | RIGHT TURN Easy 4 Hour Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 431 | RIGHT TURN Easy 4 Hour Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 432 | Easy - Payless - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 432 | Easy - Payless - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 433 | Low Price - Simple - Fun Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 433 | Low Price - Simple - Fun Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 434 | Payless - EZ - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 434 | Payless - EZ - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 435 | Cheaper - Easier - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 435 | Cheaper - Easier - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 436 | Online, Anywhere, Anytime Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 436 | Online, Anywhere, Anytime Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 437 | Piece of Cake Traffic School Classroom or Online | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 437 | Piece of Cake Traffic School Classroom or Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 438 | Minimum Hassle, Super Easy 100% Online School | — | https://123azol.com/contact-us/ | — | no candidates |
| Arizona | 438 | Minimum Hassle, Super Easy 100% Online School | — | https://123azol.com/contact-us/ | — | no candidates |
| Arizona | 439 | Green Light Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | ambiguous: 2 candidates pass (Green Light Defensive Driving; Green Light Comedy) |
| Arizona | 439 | Green Light Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | ambiguous: 2 candidates pass (Green Light Defensive Driving; Green Light Comedy) |
| Arizona | 440 | Green Light A+ Rated Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 440 | Green Light A+ Rated Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 442 | Green Light 4 Hour Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 442 | Green Light 4 Hour Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 443 | Defensive Action: Rules for the Road | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 443 | Defensive Action: Rules for the Road | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 444 | Defensive Driving Techniques for Arizona | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 444 | Defensive Driving Techniques for Arizona | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 445 | Arizona's Decorated Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 445 | Arizona's Decorated Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 446 | RIGHT TURN Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 446 | RIGHT TURN Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 447 | RIGHT TURN 4 Hour Online Easy Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 447 | RIGHT TURN 4 Hour Online Easy Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 448 | RIGHT TURN Online Defensive Driving School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 448 | RIGHT TURN Online Defensive Driving School | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 449 | RIGHT TURN Easy Online Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 449 | RIGHT TURN Easy Online Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 450 | RIGHT TURN Online Easy 4 Hour School | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 450 | RIGHT TURN Online Easy 4 Hour School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 451 | Affordable Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 451 | Affordable Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 452 | Highway Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 452 | Highway Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 453 | DriveSafe Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 453 | DriveSafe Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 454 | Arizona Institute for Driver Safety | — | http://institutefordriverssafety.org | — | no candidate with the school's name |
| Arizona | 454 | Arizona Institute for Driver Safety | — | http://institutefordriverssafety.org | — | no candidate with the school's name |
| Arizona | 455 | Drive Safe | — | http://institutefordriverssafety.org | — | no candidate with the school's name |
| Arizona | 455 | Drive Safe | — | http://institutefordriverssafety.org | — | no candidate with the school's name |
| Arizona | 456 | RIGHT TURN Online 4 Hour Easy Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 456 | RIGHT TURN Online 4 Hour Easy Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 457 | RIGHT TURN 4 Hour Online School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 457 | RIGHT TURN 4 Hour Online School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 458 | RIGHT TURN Online Easy Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 458 | RIGHT TURN Online Easy Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 459 | RIGHT TURN Online 4 Hour Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 459 | RIGHT TURN Online 4 Hour Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 460 | RIGHT TURN Easy 4 Hour Online Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 460 | RIGHT TURN Easy 4 Hour Online Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 461 | Online at Your Pace Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 461 | Online at Your Pace Defensive Driving | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 463 | At Home or Mobile Defensive Driving Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 463 | At Home or Mobile Defensive Driving Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 465 | Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 465 | Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 466 | Defensive Driving: How to Drive Safer | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 466 | Defensive Driving: How to Drive Safer | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 467 | Defensive Driving Online AZ | — | https://123azol.com/contact-us/ | — | ambiguous: 2 candidates pass (AZ Fast 4 Hour Defensive Driving; 123 Az Online Driving School) |
| Arizona | 467 | Defensive Driving Online AZ | — | https://123azol.com/contact-us/ | — | ambiguous: 2 candidates pass (AZ Fast 4 Hour Defensive Driving; 123 Az Online Driving School) |
| Arizona | 468 | Accelerated Defensive Driving School Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 468 | Accelerated Defensive Driving School Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 469 | Accelerated Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 469 | Accelerated Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 470 | Arizona Academy of Confident Driving | — | https://www.signalsimon.com/ | — | no candidate with the school's name |
| Arizona | 470 | Arizona Academy of Confident Driving | — | http://www.jacobsdrivingschool.com/ | — | no candidate with the school's name |
| Arizona | 471 | EZ AZ Simple Traffic School | — | https://ezazlms.com/contact | — | no candidates |
| Arizona | 471 | EZ AZ Simple Traffic School | — | https://ezazlms.com/contact | — | no candidates |
| Arizona | 472 | Drop the Ticket AZ Traffic School, LLC | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 472 | Drop the Ticket AZ Traffic School, LLC | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 473 | Dismiss That Ticket AZ Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 473 | Dismiss That Ticket AZ Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 475 | EZ AZ Fast Traffic School | — | https://ezazlms.com/contact | — | no candidate with the school's name |
| Arizona | 475 | EZ AZ Fast Traffic School | — | https://ezazlms.com/contact | — | no candidate with the school's name |
| Arizona | 476 | EZ AZ The Best Traffic School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidates |
| Arizona | 476 | EZ AZ The Best Traffic School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidates |
| Arizona | 477 | EZ AZ 1 | — | https://ezazlms.com/contact | — | no candidates |
| Arizona | 477 | EZ AZ 1 | — | https://ezazlms.com/contact | — | no candidates |
| Arizona | 478 | AZ Ticket Busters | — | https://ticketbusters.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp | — | no candidate with the school's name |
| Arizona | 478 | AZ Ticket Busters | — | https://ticketbusters.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp | — | no candidate with the school's name |
| Arizona | 479 | Funny Driving - Defensive Driving With Comedy | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 479 | Funny Driving - Defensive Driving With Comedy | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 480 | * * * Fast Affordable Online Traffic School * * * | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 480 | * * * Fast Affordable Online Traffic School * * * | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 481 | Online Traffic Education | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 481 | Online Traffic Education | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 482 | AZ Fast 4 Hour Defensive Driving Services | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 482 | AZ Fast 4 Hour Defensive Driving Services | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 483 | Green Light Comedy Defensive Driving School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 483 | Green Light Comedy Defensive Driving School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 484 | Comedy Traffic School Live | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 484 | Comedy Traffic School Live | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 485 | Top Rated Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 485 | Top Rated Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 486 | Green Light Makes Traffic School Easy | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 486 | Green Light Makes Traffic School Easy | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 487 | Stop and Go Traffic School | — | https://stopandgo1.com/ | — | ambiguous: 5 candidates pass (Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School) |
| Arizona | 487 | Stop and Go Traffic School | — | https://stopandgo1.com/ | — | ambiguous: 5 candidates pass (Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School) |
| Arizona | 488 | Affordable Stop and Go | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | 488 | Affordable Stop and Go | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | 489 | Stop and Go Defensive Driving | — | https://stopandgo1.com/ | — | ambiguous: 5 candidates pass (Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School) |
| Arizona | 489 | Stop and Go Defensive Driving | — | https://stopandgo1.com/ | — | ambiguous: 5 candidates pass (Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School; Stop and Go Driving School) |
| Arizona | 490 | Affordable Stop and Go Driving School | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | 490 | Affordable Stop and Go Driving School | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | 491 | Payless - Cheaper - Easy Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 491 | Payless - Cheaper - Easy Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 492 | Payless - Cheap - EZ Fast Arizona Defensive Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 492 | Payless - Cheap - EZ Fast Arizona Defensive Drive | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 493 | Cheaper - Easy - Faster Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 493 | Cheaper - Easy - Faster Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 494 | Payless - Cheap - Easy Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 494 | Payless - Cheap - Easy Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 495 | All Access Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 495 | All Access Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 496 | Arizona Advanced Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 496 | Arizona Advanced Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 497 | Complete Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 497 | Complete Defensive Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 498 | Arizonans for Better Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 498 | Arizonans for Better Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 499 | Arizona Advanced Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 499 | Arizona Advanced Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 500 | Defensible Driving Techniques for Arizonans | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 500 | Defensible Driving Techniques for Arizonans | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 502 | EZ AZ Certified 4-Hour Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 502 | EZ AZ Certified 4-Hour Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 504 | EZ AZ Defensive Driving Schools | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidates |
| Arizona | 504 | EZ AZ Defensive Driving Schools | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidates |
| Arizona | 505 | AZ Ticket Buster | — | https://ticketbusters.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp | — | no candidate with the school's name |
| Arizona | 505 | AZ Ticket Buster | — | https://ticketbusters.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp | — | no candidate with the school's name |
| Arizona | 506 | Best Value Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 506 | Best Value Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 507 | Make Driving Safe Again Arizona Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 507 | Make Driving Safe Again Arizona Driving School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 508 | Arizona Institute for Safety Education | — | http://www.nise.co/ | — | no candidate with the school's name |
| Arizona | 508 | Arizona Institute for Safety Education | — | http://www.nise.co/ | — | no candidate with the school's name |
| Arizona | 509 | Simple Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 509 | Simple Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 510 | Defending Arizona Drivers | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 510 | Defending Arizona Drivers | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 511 | Arizona Academy of Responsible Driver | — | https://azkartss.com/ | — | no candidate with the school's name |
| Arizona | 511 | Arizona Academy of Responsible Driver | — | https://azkartss.com/ | — | no candidate with the school's name |
| Arizona | 512 | RIGHT TURN Easy 4 Hour Online School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 512 | RIGHT TURN Easy 4 Hour Online School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 513 | RIGHT TURN Online Easy 4 Hour Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 513 | RIGHT TURN Online Easy 4 Hour Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 514 | RIGHT TURN 4 Hour Online Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 514 | RIGHT TURN 4 Hour Online Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 515 | RIGHT TURN 4 Hour Easy Online Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 515 | RIGHT TURN 4 Hour Easy Online Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 516 | *AZ Best Affordable Online* | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 516 | *AZ Best Affordable Online* | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 517 | Super Duper Quick & Easy | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 517 | Super Duper Quick & Easy | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 518 | *Easy Breezy Cheap Speedy* | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 518 | *Easy Breezy Cheap Speedy* | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 521 | Lose The Ticket AZ Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 521 | Lose The Ticket AZ Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 522 | Remove That Ticket AZ Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 522 | Remove That Ticket AZ Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 523 | Uh-Oh! Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 523 | Uh-Oh! Defensive Driving School | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | 524 | Green Light Presents Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 524 | Green Light Presents Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 525 | Escuela de Trafico en Comedia | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 525 | Escuela de Trafico en Comedia | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 526 | Green Light AZ Defensive Driving School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 526 | Green Light AZ Defensive Driving School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 527 | Green Light Means Go To Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 527 | Green Light Means Go To Traffic School | — | https://www.greenlightdds.com/Company/ContactUs.aspx | — | no candidate with the school's name |
| Arizona | 528 | Payless - Easier - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 528 | Payless - Easier - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 529 | Cheaper - Easier - Fun Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 529 | Cheaper - Easier - Fun Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 530 | Cheap - Easy - Payless Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 530 | Cheap - Easy - Payless Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 531 | Payless - Cheap - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 531 | Payless - Cheap - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 532 | Cheaper - EZ - Fun Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 532 | Cheaper - EZ - Fun Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 533 | Low Cost - Quick - Easy Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 533 | Low Cost - Quick - Easy Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 534 | Cheap - Easy - Faster Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 534 | Cheap - Easy - Faster Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 535 | Cheap - Fast - Easy Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 535 | Cheap - Fast - Easy Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 536 | Cheap - Quick - Bargain Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 536 | Cheap - Quick - Bargain Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 537 | Cheaper - Easier - Quick Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 537 | Cheaper - Easier - Quick Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 538 | Easy - Low Cost - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 538 | Easy - Low Cost - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 539 | Cheap - Easy - Quick Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 539 | Cheap - Easy - Quick Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 540 | Cheap - Low Cost - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 540 | Cheap - Low Cost - Fast Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 541 | Cheap - Easy - Fun Arizona Defensive Driving | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 541 | Cheap - Easy - Fun Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 542 | Cheap - Fast - Easy Dismiss Ticket Arizona Driver | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 542 | Cheap - Fast - Easy Dismiss Ticket Arizona Driver | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 543 | Low Cost - Easy - Quick Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 543 | Low Cost - Easy - Quick Arizona Defensive Driving | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 545 | RIGHT TURN Easy Online 4-Hour Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 545 | RIGHT TURN Easy Online 4-Hour Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 546 | RIGHT TURN Simple Easy Online Traffic School | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 546 | RIGHT TURN Simple Easy Online Traffic School | — | https://droptheticket.com/ | — | no candidate with the school's name |
| Arizona | 547 | RIGHT TURN Easy Simple 4-Hour Online Traffic | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 547 | RIGHT TURN Easy Simple 4-Hour Online Traffic | — | https://www.easytrafficonline.com/ | — | no candidate with the school's name |
| Arizona | 548 | RIGHT TURN Simple 4-Hour Online Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 548 | RIGHT TURN Simple 4-Hour Online Traffic School | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | 549 | RIGHT TURN Guaranteed-to-Pass Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 549 | RIGHT TURN Guaranteed-to-Pass Traffic School | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 550 | Simple and Quick Online Traffic School | — | https://www.1hourfix.com/ | — | no candidate with the school's name |
| Arizona | 550 | Simple and Quick Online Traffic School | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 551 | Easy As It Gets Defensive Driving Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 551 | Easy As It Gets Defensive Driving Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 552 | Online, Cheap, and At Your Pace Traffic School | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 552 | Online, Cheap, and At Your Pace Traffic School | — | http://www.trafficschool.com/ | — | no candidate with the school's name |
| Arizona | 553 | Quick, Cheap, and Simple Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 553 | Quick, Cheap, and Simple Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 554 | No Sweat, Low Cost Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 554 | No Sweat, Low Cost Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 555 | Piece of Cake Defensive Driving Online | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 555 | Piece of Cake Defensive Driving Online | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 556 | Fast and Cheap Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 556 | Fast and Cheap Traffic School Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 557 | Cheap N Easy by American Roadways | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 557 | Cheap N Easy by American Roadways | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 558 | Cheap and Easy Online Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 558 | Cheap and Easy Online Defensive Driving School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 559 | Wow That Was Easy Defensive Driving Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 559 | Wow That Was Easy Defensive Driving Online | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 560 | Low Cost, No Sweat Defensive Driving Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 560 | Low Cost, No Sweat Defensive Driving Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 561 | Online, Affordable, and Really Easy School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 561 | Online, Affordable, and Really Easy School | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| Arizona | 562 | Traffic School Today Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 562 | Traffic School Today Online | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 563 | Defensive Driving the Musical | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 563 | Defensive Driving the Musical | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 564 | Fast and Cheap Defensive Driving Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 564 | Fast and Cheap Defensive Driving Online | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 565 | Defensive Driving Today LLC | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 565 | Defensive Driving Today LLC | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 567 | *Super Fast AZ 24/7 | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 567 | *Super Fast AZ 24/7 | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 568 | Super Cheap AZ 24/7 Fast | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 568 | Super Cheap AZ 24/7 Fast | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 569 | The 24/7 Super Fast School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 569 | The 24/7 Super Fast School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 570 | *Open 24/7 Super Cheap AZ | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 570 | *Open 24/7 Super Cheap AZ | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Arizona | 571 | Quick Fast 24/7 AZ First | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 571 | Quick Fast 24/7 AZ First | — | https://123azol.com/contact-us/ | — | no candidate with the school's name |
| Arizona | 572 | Express Defensive Driving School | — | https://expressticketdismissal.com/ | — | ambiguous: 3 candidates pass (Express Defensive Driving School Arizona; Express Defensive Driving School AZ; Express Ticket Dismissal - Defensive Driving School) |
| Arizona | 572 | Express Defensive Driving School | — | https://expressticketdismissal.com/ | — | ambiguous: 3 candidates pass (Express Defensive Driving School Arizona; Express Defensive Driving School AZ; Express Ticket Dismissal - Defensive Driving School) |
| Arizona | 574 | Arizona's Fast Affordable | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 574 | Arizona's Fast Affordable | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 575 | Funny Defensive Driving - Comedy Course | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 575 | Funny Defensive Driving - Comedy Course | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | 580 | Fast Defensive Driving by Urban Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 580 | Fast Defensive Driving by Urban Traffic School | — | https://www.azfast4hourdd.com/ | — | no candidate with the school's name |
| Arizona | 999 | DEFENSIVE DRIVING AOC | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | 999 | DEFENSIVE DRIVING AOC | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | af | Afrikaans | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | ar | Arabic | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | az | Azerbaijani ALPHA | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | be | Belarusian | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | bg | Bulgarian | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | ca | Catalan | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | da | Danish | — | https://stopandgo1.com/ | — | no candidate with the school's name |
| Arizona | et | Estonian | — | http://tssinaz.com/ | — | no candidate with the school's name |
| Arizona | eu | Basque ALPHA | — | http://www.alpha-drivingschool.com/ | — | no candidate with the school's name |
| Arizona | fa | Persian | — | https://www.beepbeeptss.com/ | — | no candidate with the school's name |
| Arizona | fi | Finnish | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | fr | French | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | gl | Galician | — | https://justmylucktss.com/schools/aghh-gotcha-traffic-school/ | — | no candidate with the school's name |
| Arizona | hr | Croatian | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | ht | Haitian Creole ALPHA | — | http://tssinaz.com/ | — | no candidate with the school's name |
| Arizona | hy | Armenian ALPHA | — | https://crossroadstss.com/ | — | no candidate with the school's name |
| Arizona | id | Indonesian | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | is | Icelandic | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | ja | Japanese | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | ka | Georgian ALPHA | — | http://alfadoraville.com/ | — | no candidate with the school's name |
| Arizona | ko | Korean | — | https://azkartss.com/ | — | no candidate with the school's name |
| Arizona | la | Latin ALPHA | — | https://justmylucktss.com/schools/aghh-gotcha-traffic-school/ | — | no candidate with the school's name |
| Arizona | lt | Lithuanian | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | lv | Latvian | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | mk | Macedonian | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | mt | Maltese | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | no | Norwegian | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | pl | Polish | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | pt | Portuguese | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | ro | Romanian | — | https://rulesoftheroadaz.com/ | — | no candidate with the school's name |
| Arizona | sk | Slovak | — | https://azkartss.com/ | — | no candidate with the school's name |
| Arizona | sl | Slovenian | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | sq | Albanian | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | sr | Serbian | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | sv | Swedish | — | http://www.discounttrafficsurvivalschool.com/ | — | no candidate with the school's name |
| Arizona | sw | Swahili | — | http://tssinaz.com/ | — | no candidate with the school's name |
| Arizona | tl | Filipino | — | https://www.beepbeeptss.com/ | — | no candidate with the school's name |
| Arizona | tr | Turkish | — | https://olympusts.com/ | — | no candidate with the school's name |
| Arizona | uk | Ukrainian | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | ur | Urdu ALPHA | — | http://aztrafficschools.com/ | — | no candidate with the school's name |
| Arizona | vi | Vietnamese | — | http://www.tucsonsfunschool.com/ | — | no candidate with the school's name |
| Arizona | yi | Yiddish | — | http://www.jacobsdrivingschool.com/ | — | no candidate with the school's name |
| Arizona | zh-CN | Chinese (Simplified) | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| Arizona | zh-TW | Chinese (Traditional) | — | https://www.azcomedytrafficschool.com/ | — | no candidate with the school's name |
| California | E0119 | COMEDYTRAFFICSCHOOL COM | 1500 ROSECRANS AVE RM31 SUITE 500,MANHATTAN BEACH,CA 90266 | https://www.comedytrafficschool.com/ | — | listing Comedy Traffic School (ChIJRS67P9e2woARc_EGD78wCS0) was also proved for E1989 WORLD FAMOUS COMEDY TRAFFIC SCHOOL |
| California | E0122 | 7 DAYS TRAFFIC SCHOOL COM | 42620 10TH ST W UNIT A,LANCASTER,CA 93534-7035 | https://www.7daysandholidaystrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0124 | ALWAYSOPENTRAFFICSCHOOLCOM | 42600 10TH ST W UNIT A,LANCASTER,CA 93534 | https://www.urbantrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0145 | CHEAP EASY FAST TRAFFIC SCHOOL COM | 4901 MORENA BLVD STE 214 A,SAN DIEGO,CA 92117 | https://www.fast-and-easy-traffic-school.com/ | — | no candidate at this street number and ZIP |
| California | E0149 | 4 DOLLAR EZ TRAFFIC SCHOOL Com | 4901 MORENA BLVD STE 215A,SAN DIEGO,CA 92117-3423 | http://www.5dollartrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0185 | wwwFastTicketCoursecom 1 HR OR LESS | 4101 UNION AVE STE 3,BAKERSFIELD,CA 93305 | https://fastticketcourse.com/ | — | no candidate at this street number and ZIP |
| California | E0189 | wwwFastQuickCoursecom 1 HR or Less | 1508 18TH ST STE 308,BAKERSFIELD,CA 93301 | https://www.fastquickcourse.com/ | — | listing Fast Quick Course Traffic School (ChIJG8dOR00LHIgRxU3qDDY0OlM) was also proved for E9624 1 HR Or Less wwwFastQuickCoursecom |
| California | E0194 | WWW EASYPASSFASTCOURSE COM | 1901 1ST AVENUE #164,SAN DIEGO,CA 92101 | http://www.easyfastcourse.com/ | — | no candidates |
| California | E0197 | www EasyPassTicketSchool com | 1901 1ST AVENUE #130,SAN DIEGO,CA 92101 | https://www.easytrafficcurse.com/ | — | no candidate at this street number and ZIP |
| California | E0229 | Go To wwwSuperQuickTrafficSchoolcom | 431 NORTH GREEN STREET SUITE D,TEHACHAPI,CA 93561 | http://www.superquickcourse.com/ | — | no candidate at this street number and ZIP |
| California | E0241 | WWW FAST AND FUN ONLINE COM | 10944 VENTURA BLVD FL 1 4,STUDIO CITY,CA 91604 | https://www.cheapfastfun.com/contact.php | — | proved listing California Fast and Fun Traffic School has no website |
| California | E0292 | CALIFORNIA TRAFFIC SCHOOL ENG/VIET | 8907 WARNER AVE STE 151,HUNTINGTON BEACH,CA 92647-8303 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0300 | EasyCheapTrafficSchoolCom | 13724 HIGHWAY 8 BUSINESS,EL CAJON,CA 92021 | https://www.easytrafficonline.com/ | — | no candidate at this street number and ZIP |
| California | E0311 | CITATIONSTATION COM | 9705 RAIN CHECK DR,BAKERSFIELD,CA 93312 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0318 | GOODBYETICKET COM | 9800 GRIZZLY ST,BAKERSFIELD,CA 93311 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate at this street number and ZIP |
| California | E0329 | 1 HR OR LESS wwwPassTodayCoursecom | 4420 EASTON DR STE 103,BAKERSFIELD,CA 93309-1088 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0349 | Driving School of America | 229 TEWKSBURY AVE STE C,RICHMOND,CA 94801-3829 | https://www.urbantrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0399 | Go To wwwExtraFastCoursecom | 7001 WHITE LANE STE 111,BAKERSFIELD,CA 93309 | https://extraquicktrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0419 | BAY HILL TRAFFIC SCHOOL | 3769 PERALTA BLVD STE A,FREMONT,CA 94536 | http://www.bayhilltrafficschool.com/ | — | ambiguous: 2 candidates at this address carry the name (Bay Hill Traffic School; Bay Hill Driving School) |
| California | E0465 | CALIFORNIA COMEDY COURSE COM | 10944 VENTURA BLVD FL 1 5,STUDIO CITY,CA 91604 | https://www.comedytrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0637 | TrafficTutors Com | 7800 UNIVERSITY AVE SUITE B,LA MESA,CA 91942 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0666 | www TrafficSchoolExpress com | 3200 4TH AVENUE 207B,SAN DIEGO,CA 92103 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0739 | GOODNEIGHBORONLINETRAFFICSCHOOLCOM | 400 CORPORATE POINTE STE 300,CULVER CITY,CA 90230 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidates |
| California | E0748 | JOY TRAFFIC SCHOOL COM | 900 S WESTMORELAND AVE #205,LOS ANGELES,CA 90006 | http://www.trafficschool.com/ | — | no candidates |
| California | E0756 | Mirai Traffic School | 2551 LAVENDER PLACE,FAIRFIELD,CA 94533 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0803 | ACEABLE TRAFFIC SCHOOL | 100 E SAN MARCOS BLVD STE 439,SAN MARCOS,CA 92069 | http://www.acedriversed.com/ | — | no candidates |
| California | E0820 | WWW 2CHEAP2EASY COM | 2667 CAMINO DEL RIO SOUTH SUITE 214 54,SAN DIEGO,CA 92108 | https://www.easytrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0826 | RESEDA TRAFFIC SCHOOL | 21777 VENTURA BLVD STE 262,WOODLAND HILLS,CA 91364 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0843 | MODERN TRAFFIC SCHOOL | 18472 COLIMA RD 211,ROWLAND HEIGHTS,CA 91748 | https://www.moderntrafficschool.net/contact.php | — | no candidate at this street number and ZIP |
| California | E0851 | 5 D O L L A R TRAFFIC SCHOOL EASY | 4364 EAGLE ROCK BLVD,LOS ANGELES,CA 90041 | http://www.5dollartrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0855 | 5 D O L L A R TRAFFIC SCHOOL FAST | 3128 PACIFIC COAST HIGHWAY,TORRANCE,CA 90505 | http://www.5dollartrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0893 | www Cheap Traffic School 365 com | 206 W 4TH ST STE 325,SANTA ANA,CA 92701 | http://www.5dollartrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0903 | American Traffic Safety Association | 18 S SECOND STREET SUITE 150,SAN JOSE,CA 95113 | http://www.trafficschool.com/ | — | no candidates |
| California | E0917 | www E A S Y O N E D A Y com | 2292 FARADAY AVE #79,CARLSBAD,CA 92008 | https://www.easytrafficonline.com/ | — | no candidate at this street number and ZIP |
| California | E0953 | WWW EASYCHEAPCOURSE COM | 3200 4TH AVENUE 101H,SAN DIEGO,CA 92103 | https://www.easytrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E0962 | IPaylessTrafficSchoolcom | 524 MOUNTAIN VIEW AVE 1,SAN BERNARDINO,CA 92401 | https://www.trafficschoolforless.com/ | — | no candidate at this street number and ZIP |
| California | E0980 | HOSANNA TRAFFIC SCHOOL | 3242 W 8TH ST STE 108,LOS ANGELES,CA 90005 | https://www.hosannatraffic.com/ | — | ambiguous: 2 candidates at this address carry the name (Hosanna Traffic School; Hosanna Driving School) |
| California | E1178 | POWAY/RANCHO BERNARDO/PENASQUITOS | 1175 LA MOREE RD SPC 64,SAN MARCOS,CA 92078-4519 | http://www.youpassdrivingschool.com/ | — | no candidates |
| California | E1246 | www Cheap Quick Course com | 714 OAK ST,BAKERSFIELD,CA 93304 | http://www.cheapquickcourse.com/ | — | no candidate at this street number and ZIP |
| California | E1279 | WWWOLTSCOM | 16133 VENTURA BLVD STE #700,ENCINO,CA 91436 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1403 | AMERICA TRAFFIC SCHOOL | 4261 E OLYMPIC BLVD,LOS ANGELES,CA 90023 | https://www.urbantrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1412 | GREAT COMEDIANS TRAFFIC SCHOOL | 6513 CAMELLIA AVE,NORTH HOLLYWOOD,CA 91606 | https://www.comedytrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1533 | ACADEMY TRAFFIC SCHOOL | 2650 TAPO CANYON RD 105,SIMI VALLEY,CA 93021 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1663 | NICE AND EASY TRAFFIC SCHOOL | 13208 BURBANK BLVD,SHERMAN OAKS,CA 91401 | https://www.fast-and-easy-traffic-school.com/ | — | no candidate at this street number and ZIP |
| California | E1704 | LASTMINUTETRAFFICSCHOOLCOM | 18107 SHERMAN WAY STE 104A,RESEDA,CA 91335 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1779 | NATIONAL DRIVING/TRAFFIC SCHOOL | 1600 SHATTUCK AVENUE SUITE 205,BERKELEY,CA 94709 | https://ntsi.com/california/ | — | no candidate at this street number and ZIP |
| California | E1838 | DONETODAYTRAFFICSCHOOLCOM | 18107 SHERMAN WAY # 112,RESEDA,CA 91335 | https://www.donetodaytrafficschool.com/contact-us | — | no candidate at this street number and ZIP |
| California | E1854 | SAFE2DRIVE | 30212 TOMAS SUITE 200A,RANCHO SANTA MARGARITA,CA 92688 | https://www.safe2drive.com/ | — | listing Safe2Drive (ChIJtbpfnr1c2YAR_caDyBOicTM) was also proved for 038 Safe2Drive |
| California | E1862 | OC TRAFFIC SCHOOL | 13872 HARBOR BLVD STE 1D,GARDEN GROVE,CA 92843 | http://www.vmdtrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1863 | EASY 4 U TRAFFIC SCHOOL | 1151 HARBOR BAY PKWY STE 208G,ALAMEDA,CA 94502 | https://www.easytrafficonline.com/ | — | no candidates |
| California | E1878 | WWW SHORTDAYTRAFFICSCHOOL COM | 1333 HAYS ST STE 101,SAN LEANDRO,CA 94577 | http://www.trafficschool.com/ | — | no candidates |
| California | E1883 | wwwGot A Ticketcom FASTEST COURSE | 1412 17TH ST STE 257,BAKERSFIELD,CA 93301-5219 | https://fastticketcourse.com/ | — | no candidates |
| California | E1892 | ONEDAYTRAFFICSCHOOL COM | 41593 WINCHESTER ROAD SUITE 200 26,TEMECULA,CA 92590 | https://www.fastoneday.com/ | — | no candidate at this street number and ZIP |
| California | E1901 | TRAFFICSCHOOLONLINE COM | 1955 CLEVELAND AVE,SANTA ROSA,CA 95401 | http://www.trafficschool.com/ | — | proved listing orange county traffic school \| online ca traffic school has no website |
| California | E1924 | WWW CHEAP FAST FUN COM | 6454 VAN NUYS BLVD STE 150-18,VAN NUYS,CA 91401 | https://www.cheapfastfun.com/contact.php | — | no candidate at this street number and ZIP |
| California | E1926 | WWW FUN 4U FAST 2 COM | 6454 VAN NUYS BLVD STE 150-36,VAN NUYS,CA 91401 | https://www.cheapfastfun.com/contact.php | — | no candidate at this street number and ZIP |
| California | E1937 | WORLDS FASTEST TRAFFIC SCHOOL COM | 6829 LANKERSHIM BLVD STE 101,NORTH HOLLYWOOD,CA 91605 | https://www.samedaycourse.com/ | — | no candidate at this street number and ZIP |
| California | E1938 | COMEDIANS TEACH YOU ONLINE COM | 9508 FIRESTONE BL,DOWNEY,CA 90241 | https://www.comedyschoolonline.com/ | — | no candidate at this street number and ZIP |
| California | E1966 | BEST TRAFFIC SCHOOL COM | 15760 VENTURA BLVD SUITE 700,ENCINO,CA 91436 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate at this street number and ZIP |
| California | E1970 | MVO CHEAP TRAFFIC SCHOOL | 451 W ROSECRANS AVE UNIT D,COMPTON,CA 90222 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1980 | TRAFFICSCHOOLTOGOCOM | 16133 VENTURA BLVD STE 700,ENCINO,CA 91436 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1985 | ALWAYS ONLINE TRAFFIC SCHOOL | 16530 VENTURA BLVD SUITE 208A,ENCINO,CA 91436 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1986 | 24 7 TRAFFIC SCHOOL ONLINE | 4514 ISH DRIVE STE 107,SIMI VALLEY,CA 93063 | http://www.5dollartrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E1989 | WORLD FAMOUS COMEDY TRAFFIC SCHOOL | 1500 ROSECRANS AVE RM22 SUITE 500,MANHATTAN BEACH,CA 90266 | https://www.comedytrafficschool.com/ | — | listing Comedy Traffic School (ChIJRS67P9e2woARc_EGD78wCS0) was also proved for E0119 COMEDYTRAFFICSCHOOL COM |
| California | E8320 | EASY N QUICK TRAFFIC SCHOOL COM | 11500 OLYMPIC BLVD SUITE 400 RM 490,LOS ANGELES,CA 90064 | https://easyquicktrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E8581 | FINISHFAST COM | 2808 F ST STE C,BAKERSFIELD,CA 93301 | https://finishtodaytrafficschool.com/index.cfm?fuseaction=Main.showContact | — | no candidate at this street number and ZIP |
| California | E9624 | 1 HR Or Less wwwFastQuickCoursecom | 1508 18TH ST STE 330,BAKERSFIELD,CA 93301 | https://www.fastquickcourse.com/ | — | listing Fast Quick Course Traffic School (ChIJG8dOR00LHIgRxU3qDDY0OlM) was also proved for E0189 wwwFastQuickCoursecom 1 HR or Less |
| California | E9625 | 1 HOUR wwwVeryEasyTrafficSchoolcom | 5016 CALIFORNIA AVE STE 4,BAKERSFIELD,CA 93308 | https://www.veryeasytrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E9626 | 1 Hour FAST wwwReallyEasyCoursecom | 301 H ST STE A,BAKERSFIELD,CA 93304 | https://www.fastpasstrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E9628 | 1 Hour FAST wwwSuperFastCoursecom | 1514 18TH ST,BAKERSFIELD,CA 93301 | https://extraquicktrafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E9629 | 1 Hr Or LESS wwwPassNowCoursecom | 6308 SEVEN SEAS AVE,BAKERSFIELD,CA 93308 | https://www.fastonlinecourse.com/ | — | no candidates |
| California | E9633 | 1 HR OR LESS wwwVeryFastCoursecom | 6801 WHITE LN STE G2,BAKERSFIELD,CA 93309-0302 | https://www.1hourfix.com/ | — | no candidate at this street number and ZIP |
| California | E9636 | NOBODYLIKESTICKETSCOM | 33 S REAL RD 6,BAKERSFIELD,CA 93309 | http://www.trafficschool.com/ | — | no candidate at this street number and ZIP |
| California | E9637 | www Cheap Fast Course Com | 10910 MAIN ST,LAMONT,CA 93241 | https://www.cheapfastcourse.com/ | — | no candidate at this street number and ZIP |
| California | E9644 | wwwEasyOnlineCoursecom 1 HR COURSE | 1412 17TH STREET SUITE 361,BAKERSFIELD,CA 93301 | https://www.easytrafficonline.com/ | — | no candidate at this street number and ZIP |
| Connecticut | CT-approved | Leave feedback | — | https://www.surveymonkey.com/r/7J9LBCF | — | no candidate with the school's name |
| Connecticut | CT-approved | Work at the DMV | — | https://www.jobapscloud.com/ct/ | — | no candidate with the school's name |
| Connecticut | CT-approved | DEPARTMENT OF MOTOR VEHICLES | — | https://portal.ct.gov/dmv | — | ambiguous: 3 candidates pass (Connecticut Department of Motor Vehicles; Connecticut Department of Motor Vehicles; Connecticut Department of Motor Vehicles) |
| Florida | — | DriverEducators.com LLC (Orange and Osceola Counties Only) | — | https://BDISchool.com | — | no candidates |
| Florida | — | EasyDoesItTrafficSchool.com (Orange and Osceola County Citations Only) | — | https://www.easydoesittrafficschool.com/ | — | no candidate with the school's name |
| Florida | — | Low Cost 24/7 Defensive Driving with Music | — | https://florida.americanroadways.org | — | no candidate with the school's name |
| Florida | — | Defensive Drivers Institute (Orange and Osceola County Citations Only) | — | https://defensivedriversinstitute.com/florida-bdi/ | — | no candidate with the school's name |
| Florida | — | DriveSafeToday.com, Inc. | — | https://www.drivesafetoday.com/courses/florida/basic-driver-improvement-course | — | no candidate with the school's name |
| Florida | — | American Safety Institute, LLC | — | https://americansafetyinstitute.com/4-hour-basic-driver-improvement/ | — | ambiguous: 2 candidates pass (American Safety Institute; American Safety Institute) |
| Florida | — | Florida Online BDI (Orange and Osceola County Citations Only) | — | https://www.floridaonlinebdi.com | — | no candidate with the school's name |
| Florida | — | Miscrianti (Miami-Dade County Citations Only) | — | https://miscrianti.com/ | — | no candidate with the school's name |
| Florida | — | Traffic School Online.com | — | http://www.trafficschoolonline.com/florida-traffic-school | — | no candidate with the school's name |
| Florida | — | Florida Educational Driving School | — | http://www.fedsafe.com | — | no candidate with the school's name |
| Florida | — | Florida Highway Safety Alliance (Hillsborough County Citations Only) | — | https://floridaprodrivingacademycom.kinsta.cloud/ | — | no candidate with the school's name |
| Florida | — | NexLearn | — | https://www.drivesafeonline.org/florida/basic-driver-improvement/ | — | no candidate with the school's name |
| Florida | — | National Highway Safety Administration | — | https://nhsa.com/en/florida-basic-driver-improvement-course | — | proved listing National Highway Safety Administration has no website |
| Florida | — | Dummies Traffic School .com | — | http://www.dummiestrafficschool.com/ | — | no candidate with the school's name |
| Florida | — | Cheap-Easy-Fast-Florida-Traffic School | — | https://www.cheapeasyfastfl.com/ | — | no candidate with the school's name |
| Florida | — | Comedy Safe Driver (Broward County Citations Only) | — | https://comedysafedriver.com/florida-online-traffic-school.html | — | no candidate with the school's name |
| Florida | — | Comedy Driving Traffic School | — | http://www.comedydrivingtrafficschool.com | — | ambiguous: 5 candidates pass (Comedy Traffic School; Comedy Traffic School; Comedy Traffic School; Comedy Traffic School; Comedy Traffic School) |
| Florida | — | 1st Drive (Miami-Dade County Citations only) | — | https://1stdrive.us/florida/ | — | no candidate with the school's name |
| Florida | — | $15 Florida BDI (Miami/Dade County Only) | — | http://www.15dollarfloridabdi.com/ | — | no candidate with the school's name |
| Florida | — | I Drive Safely | — | https://www.idrivesafely.com/traffic-school/florida/ | — | no candidate with the school's name |
| Florida | — | Florida Fun Traffic School | — | http://www.floridafuntrafficschool.com/ | — | ambiguous: 3 candidates pass (Florida Fun Traffic School; Funny in Florida traffic School; Funny In Florida Traffic School Courses) |
| Florida | — | Best Price Traffic School | — | http://www.bestpricetrafficschool.com/florida-defensive-driving-course.html | — | ambiguous: 2 candidates pass (Best Price Traffic School; Best Price Traffic School) |
| Florida | — | Traffic School by The Improv Comedy Club | — | http://www.myImprov.com/traffic-school/Florida | — | no candidate with the school's name |
| Florida | — | National Safety Council | — | https://www.drivesafe.com/florida-online-defensive-driving-course/ | — | no candidate with the school's name |
| Florida | — | Comedy Defensive Driving | — | http://comedydefensivedriving.com/florida-traffic-school/ | — | ambiguous: 5 candidates pass (Comedy Traffic School; Comedy Traffic School; Comedy Traffic School Boca Raton; Comedy Traffic School; Comedy Traffic Schools) |
| Florida | — | Gold Traffic School | — | http://www.goldtrafficschool.com/ | — | ambiguous: 2 candidates pass (Gold Traffic School; Golden Gate Traffic School) |
| Florida | — | Online Traffic Education | — | http://www.onlinetrafficeducation.com/Florida.php | — | no candidate with the school's name |
| Florida | — | Florida Safety Council | — | http://www.floridasafety.org | — | ambiguous: 5 candidates pass (Florida Safety Council; Florida Safety Council; Florida Safety Council; Florida Safety Council; Florida Safety Council) |
| Florida | — | Driving Logic (Clay, Duval, Nassau County Citations Only) | — | https://mydrivinglogic.com | — | no candidates |
| Florida | — | 1SafeDriver.com | — | http://www.1safedriver.com/ | — | no candidate with the school's name |
| Florida | — | DriveSafe Inc. | — | https://drivesafe.us/florida/bdi.html | — | ambiguous: 3 candidates pass (Drive Safe Traffic School in key largo and miami dade; Drive Safe Tampa; Drive Safe Tampa) |
| Florida | — | Traffic School Florida (Orange and Osceola County Citations Only) | — | https://www.trafficschoolflorida.com | — | no candidate with the school's name |
| Florida | — | Traffic Safety Institute (Palm Beach County Citations Only) | — | https://start.trafficsafetyinstitute.com/florida-traffic-school | — | no candidate with the school's name |
| Florida | — | $4 Driver Improvement by NiSE | — | https://bdi.nise.co | — | no candidate with the school's name |
| Florida | — | Approved Florida BDI Shortest Course Allowed (Broward County Citations Only) | — | https://approved-nds.com/courses/4-hour-basic-driver-improvement/ | — | no candidate with the school's name |
| Florida | — | Easy Online Traffic School | — | https://www.CheaperFasterEasierFL.com | — | ambiguous: 2 candidates pass (Easy driving & traffic school; Easy Traffic School Online) |
| Florida | — | $5 Dollar Traffic School (Orange and Osceola County Citations Only) | — | https://www.5dollartrafficschool.com/Florida/BDI-Course/registration.php | — | no candidate with the school's name |
| Florida | — | 12 Dollar Cheap and Simple (Pasco and Pinellas County Citations Only) | — | https://www.12DollarCheapandSimple.com | — | no candidate with the school's name |
| Florida | — | Too Cool Traffic School | — | https://www.toocooltrafficschool.com/florida/bdi | — | no candidate with the school's name |
| Florida | — | Funny in Florida (Traffic Safety Consultants) | — | http://www.funnyinflorida.com/ | — | no candidate with the school's name |
| Florida | — | Defensive Drivers Discount (Broward County Citations Only) | — | http://www.defensivedriversdiscount.com | — | no candidate with the school's name |
| Florida | — | Funny Driving LLC (Orange and Osceola County Citations Only) | — | https://www.funnydriving.com/florida | — | no candidate with the school's name |
| Florida | — | Cyberactive (Miami-Dade Citations Only) | — | https://www.gototrafficschool.com/florida | — | no candidate with the school's name |
| Florida | — | Aceable (Miami Dade county Citations Only) | — | https://www.aceable.com/driver-improvement/florida/ | — | no candidate with the school's name |
| Georgia | DI002034 | ASSURANCE II DEFENSIVE DRIVING SCHOOL | 910 DANNON VW SW STE 2201 ATLANTA GA 30331-2156 | https://drivingunderintelligence.com/ | — | no candidate at this street number and ZIP |
| Georgia | DI002196 | # 1 A 1/MARIETTA DUI & DEFENSIVE DRIVING SCHOOL | 1477 ROSWELL RD STE 500 MARIETTA GA 30062-3707 | http://www.a1drivingschools.com/ | — | no candidate at this street number and ZIP |
| Georgia | DI002218 | DUI COURT SERVICES | 1613 UNION ST BRUNSWICK GA 31520-6734 | https://aacsatlanta.com/dui-school-risk-reduction-program-rrp/ | — | no candidate at this street number and ZIP |
| Georgia | DI002266 | DEVINE DUI & DEFENSIVE DRIVING SCHOOL | 7 LAGRANGE ST GRANTVILLE GA 30220-3400 | http://gwinnettduischool.com/ | — | no candidate at this street number and ZIP |
| Georgia | DI002281 | CLEAR VISION DUI RISK REDUCTION PROGRAM | 2706 MILLEDGEVILLE RD AUGUSTA GA 30904-5112 | https://clearvisiondui.com/ | — | ambiguous: 2 candidates at this address carry the name (Clear Vision DUI Risk Reduction Program; Clear Vision DUI School) |
| Georgia | DI002286 | DUI SCHOOL OF COWETA INC | 127 TEMPLE AVE NEWNAN GA 30263-1666 | http://duischoolofcoweta.com/ | — | no candidate at this street number and ZIP |
| Georgia | DI002309 | A CHANGE IS GONNA COME | 1540 HIGHWAY 19 N STE E THOMASTON GA 30286-2261 | http://www.secondchanceriskreduction.com/ | — | ambiguous: 2 candidates at this address carry the name (A Change Is Gonna Come; My Change Is Gonna Come) |
| Georgia | DI002317 | DALLAS HIRAM DUI SCHOOL | 105 VILLAGE WALK STE 278 DALLAS GA 30132-5506 | http://dallashiramduischool.com/ | — | no candidate at this street number and ZIP |
| Georgia | DI002323 | EC DUI SCHOOL | 20 TOWER PL NEWNAN GA 30263-1480 | http://www.ecdui.com/ | — | no candidate at this street number and ZIP |
| Georgia | DI200100 | A ACTION DEFENSIVE DRIVING AND DUI SCHOOL | 3988 SALEM RD COVINGTON GA 30016-4529 | https://www.duidrivingschool.com/ | — | no candidate at this street number and ZIP |
| Georgia | GA-approved | Georgia Department ofDriver Services | Privacy Statement Contact Us | https://www.facebook.com/GeorgiaDDS/?ref=ts | — | ambiguous: 5 candidates pass (Georgia Department of Driver Services - Atlanta; Georgia Department of Driver Services; Georgia Department of Driver Services; Georgia Department of Driver Services; Georgia Department of Driver Services - Between) |
| Maryland | MD-approved | Glen Burnie, MD 21062 | — | http://www.bandabrothersdrivingacademy.com/ | — | no candidate with the school's name |
| Maryland | MD-approved | www.driveontimeschool.com/ | — | https://www.gregsdrivingschool.net | — | no candidate with the school's name |
| Maryland | MD-approved | (Approved by the Maryland Motor Vehicle Administration) | — | https://www.mddrivingschool.com/ | — | no candidate with the school's name |
| Maryland | MD-approved | www.facebook.com/cecildrivingschool/ | — | https://www.driveontimeschool.com/ | — | no candidate with the school's name |
| Maryland | MD-approved | www.bestdriving.com | — | https://www.facebook.com/cecildrivingschool/ | — | ambiguous: 3 candidates pass (Best Driving Academy; Best Driving School; Best Driving School) |
| Maryland | MD-approved | www.alfredosdrivingschool.com | — | https://www.bestdriving.com | — | listing Alfredo's Driving School (ChIJJcHUTej2t4kRDhmHYmOXzY8) was also proved for MD-approved Alfredo's Driving School, Inc. |
| Maryland | MD-approved | Alfredo's Driving School, Inc. | — | https://www.alfredosdrivingschool.com | — | listing Alfredo's Driving School (ChIJJcHUTej2t4kRDhmHYmOXzY8) was also proved for MD-approved www.alfredosdrivingschool.com |
| Maryland | MD-approved | www.driveontimeschool.com/ | — | https://www.gregsdrivingschool.net | — | no candidate with the school's name |
| Maryland | MD-approved | (Approved by the Maryland Motor Vehicle Administration) | — | https://www.mddrivingschool.com/ | — | no candidate with the school's name |
| Maryland | MD-approved | www.facebook.com/cecildrivingschool/ | — | https://www.driveontimeschool.com/ | — | no candidate with the school's name |
| Maryland | MD-approved | Maryland Department of Transportation Motor Vehicle Administration | — | http://www.mdot.maryland.gov/ | — | no candidate with the school's name |
| Maryland | MD-approved | A Widmyer Driving School | — | https://www.widmyer.com | — | no candidate with the school's name |
| Maryland | MD-approved | www.gregsdrivingschool.net | — | https://www.premierdriversed.com | — | no candidate with the school's name |
| Maryland | MD-approved | www.linneldrivingschool.com | — | https://www.linneldrivingschool.com/ | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | TDD for the hearing impaired only | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://trafficsafetyschoolnv.com/ | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | (702) 486-4368 | — | http://learntodriveaz.com/ | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Carson City, NV 89711 | — | https://trafficsafetyschoolnv.com/ | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Location | — | https://www.urbantrafficschool.com/nevada | — | no candidate with the school's name |
| Nevada | NV-approved | Safe2Drive 4760 S. Pecos Road #103 Las Vegas, NV 89121 (800) 763-1297 TSS000027020 safe2drive.com | ✔Internet Correspondence Classroom | https://safe2drive.com | — | no candidate with the school's name |
| Nevada | NV-approved | $10 Traffic School 444 E. William Street Suite 9 Carson City, NV 89701 (775) 331-7441 TSS000024880 nvcts.com | ✔Internet Correspondence ✔Classroom | https://nvcts.com | — | no candidate with the school's name |
| Nevada | NV-approved | ABC DRIVE SAFE 3651 Lindell Road, Suite D515 Las Vegas, NV 89103 (775) 338-6269 TSS000052685trafficschoolnv.com | ✔Offered in Spanish ✔Internet Correspondence Classroom | https://trafficschoolnv.com/ | — | no candidate with the school's name |
| Nevada | NV-approved | ABC Drive Safe 634 Ryland Street, Suite 410 Reno, NV 89502-1640 (775) 338-6269 TSS000047687 trafficschoolnv.com | ✔Internet Correspondence Classroom | https://trafficschoolnv.com | — | no candidate with the school's name |
| Nevada | NV-approved | Traffic101.com, Inc. 1429 Palm Street Henderson, NV 89011 (800) 373-7313 TSS000025789 traffic101.com | ✔Internet Correspondence Classroom | https://traffic101.com | — | no candidate with the school's name |
| Nevada | NV-approved | ABC Therapy 730 N. Eastern Avenue #130 Las Vegas, NV 89101 (702) 598-2020 TSS000040438 abctherapy.net | Internet Correspondence ✔Classroom | https://www.abctherapy.net/ | — | no candidate with the school's name |
| Nevada | NV-approved | Online Traffic School 5301 Longley Ln #1 Reno, NV 89511 (800) 800-3579 TSS000025400 onlinetrafficschool.com | ✔Internet Correspondence Classroom | https://onlinetrafficschool.com | — | no candidate with the school's name |
| Nevada | NV-approved | American Safety Council 123 W. Nye Lane #491 Carson City, NV 89706 (888) 349-8425 TSS000029695 trafficschooltogo.com | ✔Internet Correspondence Classroom | https://trafficschooltogo.com | — | no candidate with the school's name |
| Nevada | NV-approved | $10 Traffic School 3355 Spring Mountain Rd. Ste 29 Las Vegas, NV 89107 (725) 287-7949 TSS000053193 nvcts.com | ✔Internet Correspondence Classroom | https://nvcts.com | — | no candidate with the school's name |
| Nevada | NV-approved | ABC Therapy 7 Water Street, Suite B Henderson, NV 89015 (702) 598-2020 TSS000040158 abctherapy.net | ✔Internet Correspondence ✔Classroom | https://www.abctherapy.net/ | — | no candidate with the school's name |
| Nevada | NV-approved | BOSS Court Education LLC 2080 Waite Ave Logandale, NV 89021 (435) 632-6265 TSS000043904 bosscourteducation.com | ✔Internet Correspondence Classroom | https://bosscourteducation.com | — | no candidate with the school's name |
| Nevada | NV-approved | Driver Education Center 9359 Bay Drive Reno, NV 89506 (775) 329-2888 TSS000048691 nvtraffic.com | ✔Internet Correspondence ✔Classroom | https://nvtraffic.com | — | no candidate with the school's name |
| Nevada | NV-approved | Go To Traffic School 711 S. Carson Street Carson City, NV 89701 (888) 329-7069 TSS000053050 gototrafficschool.com | ✔Internet Correspondence Classroom | https://gototrafficschool.com | — | no candidate with the school's name |
| Nevada | NV-approved | I Drive Safely 500 N. Rainbow Blvd #300 Las Vegas, NV 89017 (760) 692-3235 TSS000025547 idrivesafely.com | ✔Internet Correspondence Classroom | https://idrivesafely.com | — | no candidate with the school's name |
| Nevada | NV-approved | LRS Systems Ltd 600 S. 7th Street Las Vegas, Nevada 89101 (702) 732-0214 TSS000024547 lrssystems.com | ✔Internet Correspondence Classroom | https://lrssystems.com | — | no candidate with the school's name |
| Nevada | NV-approved | Driver Education Center 385 Freeport Blvd Sparks, NV 89436 (775) 329-2888 TSS000048691 | ✔Internet Correspondence Classroom | http://internetdrivered.com/ | — | no candidate with the school's name |
| Nevada | NV-approved | $10 Traffic School 1016 N. Rock Blvd Sparks, NV 89431 (775) 331-7441 TSS000026665 nvcts.com | ✔Internet Correspondence Classroom | https://nvcts.com | — | no candidate with the school's name |
| New Jersey | NJ-approved | Disabled Veteran Owned Traffic School www.disabledveteranowned.com | kevin@vetnational.com | http://disabledveteranowned.com | — | no candidate with the school's name |
| New Jersey | NJ-approved | AA Auto Traffic School, Inc www.aaautotraffic.com | aatrafficschool@gmail.com | http://www.aaautotraffic.com | — | no candidate with the school's name |
| New Jersey | NJ-approved | ATG Traffic School www.atgtrafficschool.com | atgtrafficschool@gmail.com | http://www.atgtrafficschool.com | — | no candidate with the school's name |
| New Jersey | NJ-approved | Garden State Safety Council www.GardenStateSafetyCouncil.com | ADellasso@gmail.com | http://www.GardenStateSafetyCouncil.com | — | no candidate with the school's name |
| New Jersey | NJ-approved | Fast and Stress Free Traffic School www.fastandstressfreetrafficschool.com | support@fastandstressfreetrafficschool.com | http://www.fastandstressfreetrafficschool.com | — | no candidate with the school's name |
| New York | NY-PIRP | American Automobile Association (AAA) | 1415 Kellum Place Garden City, NY 11530-1690 1-844-708-0968 | https://www.aaa.com/stop/ | — | no candidate at this street number and ZIP |
| New York | NY-PIRP | American Safety Council SafeMotorist (Available in English and Spanish) | 218 West Main Street Malone, NY 12953 1-877-689-0674 | https://www.newyorksafetycouncil.com/ | — | no candidate at this street number and ZIP |
| New York | NY-PIRP | Driver Training Associates (DTA) | 125 High Rock Avenue, Suite 210 Saratoga Springs, NY 12866 1-800-558-9887 | https://ticketschool.com/courses/new-york-defensive-driving-online/ | — | no candidates |
| New York | NY-PIRP | American Safety Council | 218 West Main Street Malone, NY 12953 1-877-689-0674 | https://www.safemotorist.com/ | — | no candidates |
| New York | NY-PIRP | AAAA Defensive Driving Course by IMPROV | 445 Hamilton Avenue, Suite 1102 White Plains, NY 10601 1-800-660-8908 | https://www.myimprov.com/defensive-driving/new-york/ | — | no candidate at this street number and ZIP |
| New York | NY-PIRP | AARP | 780 3rd Avenue - 33rd Floor New York, NY 10017-2024 1-866-227-7442 | https://www.aarp.org/auto/driver-safety/ | — | ambiguous: 2 candidates at this address carry the name (AARP New York State Office; AARP Integrated Media Sales) |
| New York | NY-PIRP | I DRIVE SAFELY, LLC (Internet course) | I DRIVE SAFELY, LLC (Internet course) | https://www.idrivesafely.com/defensive-driving/new-york/pirp/ | — | no candidate with the school's name |
| New York | NY-PIRP | AARP Smart Driver online course | 13805 West Road #22 Houston, TX 77041 1-800-350-7025 | https://www.aarpdriversafety.org/ | — | no candidates |
| New York | NY-PIRP | National Safety Council | Phone Contact, Personal and Content Questions | https://www.drivesafe.com/new-york-online-defensive-driving-course/ | — | no candidate with the school's name |
| New York | NY-PIRP | NYDDC LLCDBA Defensive Drivers Discount | 80 Business Park Drive, Suite 202 Armonk, New York 10504 1-877-697-2331 | https://www.defensivedriversdiscount.com/ | — | ambiguous: 2 candidates at this address carry the name (NY Defensive Driver's Discount; Defensive Drivers Discount) |
| New York | NY-PIRP | Driver Training Associates (DTA) | 125 High Rock Avenue, Suite 210 Saratoga Springs, NY 12866 1-800-558-9887 | https://ticketschool.com/courses/new-york-defensive-driving-online/ | — | no candidates |
| New York | NY-PIRP | National Safety Council | Phone Contact, Personal and Content Questions | https://www.drivesafe.com/new-york-online-defensive-driving-course/ | — | no candidate with the school's name |
| New York | NY-PIRP | AAA Driver Improvement Program | 1415 Kellum Place Garden City, NY 11530 1-844-708-0968 | https://www.aaa.com/stop/?area=defensivedriving | — | no candidate at this street number and ZIP |
| New York | NY-PIRP | American Safety | 111 Washington Avenue - Suite 606 Albany, NY 12210 1-800-800-7121 | https://www.bigappletrafficschool.com/ | — | no candidate at this street number and ZIP |
| New York | NY-PIRP | American Safety | 111 Washington Avenue - Suite 606 Albany, NY 12210 1-800-800-7121 | https://www.bigappletrafficschool.com/ | — | no candidate at this street number and ZIP |
| North Dakota | ND-approved | American Safety Council 800-732-4315 | — | https://www.americansafetycouncil.com/ | — | no candidates |
| North Dakota | ND-approved | ND Safety Council 701-223-6372 | — | http://www.ndsc.org/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Mature Driver Improvement 619-320-8606 | — | http://www.maturedrivertuneup.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Defensive Driving Institute LLC 833-921-0217 | — | http://defensidrivetrafficschool.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Traffic Safety Consultants 800-503-3381 | — | http://www.trafficsafetyconsultants.com/contact.php | — | no candidate with the school's name |
| North Dakota | ND-approved | #1 Defensive Driving Course 888-329-3136 | — | https://www.firstdrivingschools.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Defensive Driving America 800-304-6974 | — | https://defensivedrivingamerica.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | $5 Dollar Traffic School 800-934-6285 | — | http://www.5dollartrafficschool.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Traffic School Online.com 800-800-3579 | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
| North Dakota | ND-approved | Nexlearn/DriveSafeOnline 316-265-2170 | — | http://www.nexlearn.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Safe2Drive 800-763-1297 | — | https://www.safe2drive.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | ND Army National Guard 701-333-3103 | — | https://www.ndguard.nd.gov/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Defensive Driving by IMPROV™ Comedy Club 800-660-8908 | — | https://www.myimprov.com/traffic-school/california?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| North Dakota | ND-approved | Technical Training and Safety 701-250-7911 | — | https://www.ttsafety.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | AARP Driver Safety 800-350-7025 | — | http://www.aarpdriversafety.org/faq.html | — | no candidate with the school's name |
| North Dakota | ND-approved | $5 Dollar Traffic School 800-934-6275 | — | http://www.5dollartrafficschool.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | Insurance Premium Reduction Online Courses | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| North Dakota | ND-approved | AAA The Auto Club 866-659-1317 | — | https://www.aaa.com/ | — | no candidate with the school's name |
| Ohio | OH-ARO | OHIO FAST COURSE | — | http://www.1stchoiceda.com/ | — | no candidate with the school's name |
| Oregon | OR-approved | Driver Course Platform LLC dba National Course Portal | 600 West Ridge RoadWytheville, VA 24382 | https://www.nationalcourseportal.com/ | — | no candidates |
| Oregon | OR-approved | Lane County Driving School | 2146 Main StreetSpringfield, OR 97477 | http://www.lanecountydrivingschool.com/ | — | no candidate at this street number and ZIP |
| South Carolina | SC-approved | Business Customers | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Texas | 001-906-000 | NECHES ISD | 1509 ACR 346, NECHES, TX, 75779 | http://www.nechesisd.com/ | — | no candidate at this street number and ZIP |
| Texas | 001-909-000 | SLOCUM ISD | ELKHART, TX, 75839-3135 | http://www.slocumisd.org/ | — | no candidate in this ZIP with the school's name |
| Texas | 003-906-000 | ZAVALLA ISD | HWY 63, ZAVALLA, TX, 75980 | http://www.zavallaisd.org/ | — | no candidate in this ZIP with the school's name |
| Texas | 005-901-001 | ARCHER CITY ISD | 600 SOUTH ASH STREET, ARCHER CITY, TX, 76351 | http://www.archercityisd.net/ | — | ambiguous: 2 candidates at this address carry the name (Archer City Independent School District; Archer City Elementary School) |
| Texas | 007-905-001 | PLEASANTON ISD | PLEASANTON, TX, 78064-2499 | http://www.pisd.us/ | — | no candidate in this ZIP with the school's name |
| Texas | 010-901-000 | MEDINA ISD | ONE BOBCAT LANE, MEDINA, TX, 78055 | https://www.medinaisd.org/ | — | no candidate in this ZIP with the school's name |
| Texas | 015-910-000 | NORTH EAST ISD | SAN ANTONIO, TX, 78217-6209 | http://www.neisd.net/drive | — | no candidate in this ZIP with the school's name |
| Texas | 017-901-000 | BORDEN COUNTY ISD | 1001 KINCAID, GAIL, TX, 79738 | http://www.bcisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 022-004-001 | TERLINGUA CSD | TERLINGUA, TX, 79852 | https://www.terlinguacsd.com/ | — | no candidate in this ZIP with the school's name |
| Texas | 022-501-000 | SUL ROSS STATE UNIVERSITY | 400 NORTH HARRISION, ALPINE, TX, 79830 | http://www.sulross.edu/ | — | no candidate at this street number and ZIP |
| Texas | 034-901-000 | ATLANTA ISD | ATLANTA, TX, 75551-2519 | https://www.atlantaareadrivingschool.com/ | — | ambiguous: 4 candidates pass (Atlanta ISD Administration Office; Atlanta ISD High School; Atlanta ISD Transportation; Atlanta ISD D.A.E.P.) |
| Texas | 035-901-001 | DIMMITT ISD | 1505 WESTERN CIRCLE DRIVE, DIMMITT, TX, 79029 | http://www.dimmittisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 036-903-001 | EAST CHAMBERS ISD | WINNIE, TX, 77665-7678 | https://www.eastchambers.net/staff | — | no candidate in this ZIP with the school's name |
| Texas | 042-903-000 | SANTA ANNA ISD | 701 BOWIE, SANTA ANNA, TX, 76878 | https://securelanedrivingschool.com/ | — | ambiguous: 2 candidates at this address carry the name (SANTA ANNA INDEPENDENT SCHOOL DISTRICT; Santa Anna High School) |
| Texas | 045-903-001 | RICE CISD | 1095 RAIDER DRIVE, ALTAIR, TX, 77412 | http://www.safetycenterdrivingschool.com/ | — | no candidate at this street number and ZIP |
| Texas | 050-904-000 | OGLESBY ISD | COLLEGE AVE, OGLESBY, TX, 76561 | http://www.oglesbyisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 054-902-001 | LORENZO ISD | 3RD & POLK, LORENZO, TX, 79343 | http://www.lorenzoisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 061-901-000 | DENTON ISD | 230 N MAYHILL RD, DENTON, TX, 76209 | http://www.dentondrivingschool.com/ | — | no candidate at this street number and ZIP |
| Texas | 063-906-000 | PATTON SPRINGS ISD | HWY 193, AFTON, TX, 79220 | http://www.pattonsprings.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 067-903-000 | EASTLAND ISD | 900 W PLUMMER, EASTLAND, TX, 76448 | https://www.dps.texas.gov/ | — | ambiguous: 2 candidates at this address carry the name (Eastland High School; Eastland Middle School) |
| Texas | 068-501-000 | ODESSA COLLEGE | ODESSA, TX, 79764-7105 | https://coachdeedrivereducationalschoo.godaddysites.com/ | — | no candidate in this ZIP with the school's name |
| Texas | 070-915-001 | MAYPEARL ISD | 309 MAIN ST, MAYPEARL, TX, 76064 | http://www.maypearlisd.org/ | — | no candidate at this street number and ZIP |
| Texas | 074-903-001 | BONHAM ISD | 1005 CHESTNUT, BONHAM, TX, 75418 | http://www.bonhamisd.org/ | — | ambiguous: 2 candidates at this address carry the name (Bonham ISD Administration Center; Bonham Independent School District) |
| Texas | 083-902-000 | LOOP ISD | FM303 SOUTH, LOOP, TX, 79342 | http://loopisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 083-903-001 | SEMINOLE ISD | 2100 NW AVENUE D, SEMINOLE, TX, 79360 | https://www.co.gaines.tx.us/page/gaines.drivers.license | — | ambiguous: 3 candidates at this address carry the name (Seminole High School; Seminole ISD Maintenance; Seminole Isd-Athletic Department) |
| Texas | 083-903-002 | SEMINOLE ISD | 206 SW 3RD, SEMINOLE, TX, 79360 | https://www.co.gaines.tx.us/page/gaines.drivers.license | — | no candidate at this street number and ZIP |
| Texas | 089-903-001 | NIXON-SMILEY CISD | NIXON, TX, 78140-2626 | https://www.nixonsmiley.net/o/ns-daep | — | no candidate in this ZIP with the school's name |
| Texas | 092-906-002 | SABINE ISD | 5424 FM 1252 W, GLADEWATER, TX, 75647 | http://www.sabineisd.org/ | — | ambiguous: 3 candidates at this address carry the name (Sabine Independent School District; Sabine High School; Sabine Middle School) |
| Texas | 095-901-001 | STEPHENVILLE ISD | 2650 W OVERHILL, STEPHENVILLE, TX, 76401 | http://www.sville.us/ | — | no candidate at this street number and ZIP |
| Texas | 099-903-001 | QUANAH ISD | 507 EARL, QUANAH, TX, 79252 | http://www.qisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 110-907-001 | SUNDOWN ISD | 7TH & SCHOOL AVENUE, SUNDOWN, TX, 79372 | http://www.sundownisd.com/ | — | no candidate in this ZIP with the school's name |
| Texas | 112-905-000 | CUMBY ISD | CUMBY, TX, 75433-2338 | https://www.cumbyisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 113-905-000 | LATEXO ISD | 298 FM 2663, LATEXO, TX, 75849 | http://www.latexoisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 114-902-001 | COAHOMA ISD | COAHOMA, TX, 79511 | https://www.coahomaisd.com/ | — | no candidate in this ZIP with the school's name |
| Texas | 116-905-002 | GREENVILLE ISD | 3515 LIONS LAIR, GREENVILLE, TX, 75401 | https://www.tandddrivingacademy.com/ | — | no candidate at this street number and ZIP |
| Texas | 116-906-001 | LONE OAK ISD | LONE OAK, TX, 75453-5305 | https://www.loneoakisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 116-916-000 | BOLES ISD | 7071 FM 2101, QUINLAN, TX, 75474 | https://www.bolesisd.com/17009_1 | — | no candidate at this street number and ZIP |
| Texas | 121-902-001 | BROOKELAND ISD | BROOKELAND, TX, 75931-3830 | http://www.brookelandisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 139-909-999 | PARIS JUNIOR COLLEGE | 2400 CLARKSVILLE STREET, PARIS, TX, 75460 | https://www.parisjc.edu/ | — | ambiguous: 2 candidates at this address carry the name (Paris Junior College; Paris Junior College Bookstore) |
| Texas | 140-908-001 | SUDAN ISD | HWY 303, SUDAN, TX, 79371 | http://www.sudanisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 145-906-001 | NORMANGEE ISD | 116 SPUR 3, NORMANGEE, TX, 77871 | http://www.normangeeisd.org/ | — | ambiguous: 2 candidates at this address carry the name (Normangee Independent School District; Normangee Elementary School) |
| Texas | 145-911-000 | LEON ISD | 12168 HWY 79 WEST, JEWETT, TX, 75846 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | ambiguous: 3 candidates at this address carry the name (Leon Independent School District; Leon Elementary School; Leon High School) |
| Texas | 147-903-002 | MEXIA ISD | MEXIA, TX, 76667-2452 | https://www.mexiaisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 148-903-000 | HIGGINS ISD | 406 NOTH MAIN, HIGGINS, TX, 79046-0238 | https://he.whitehouseisd.org/ | — | no candidate at this street number and ZIP |
| Texas | 156-905-000 | GRADY ISD | 3500 FM 829, LENORAH, TX, 79749 | http://www.gradyisd.org/ | — | no candidate at this street number and ZIP |
| Texas | 168-901-001 | COLORADO ISD | COLORADO CITY, TX, 79512-7301 | http://www.ccity.esc14.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 187-901-000 | BIG SANDY ISD | 9180 FM 1276, LIVINGSTON, TX, 77351 | http://www.bigsandyisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 190-903-000 | RAINS HIGH SCHOOL | 1759 W US HWY 69, EMORY, TX, 75440-0247 | https://www.rainsisd.org/page/rains-high-school | — | no candidate at this street number and ZIP |
| Texas | 197-902-000 | MIAMI ISD | 100 WARRIOR LANE, MIAMI, TX, 79059 | http://www.miamiisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 201-914-001 | WEST RUSK ISD | 10705 S MAIN ST, NEW LONDON, TX, 75689 | http://highschool.westruskisd.org/ | — | no candidate at this street number and ZIP |
| Texas | 208-501-000 | WESTERN TEXAS COLLEGE | 1806 26TH STREET, SNYDER, TX, 79549 | http://www.wtc.edu/ | — | no candidate at this street number and ZIP |
| Texas | 209-902-000 | MORAN ISD | MORAN, TX, 76464-2343 | https://www.moran.esc14.net/page/homepage | — | no candidate in this ZIP with the school's name |
| Texas | 220-915-001 | AZLE ISD | 300 ROE STREET, AZLE, TX, 76020 | https://www.azleisd.net/ | — | no candidate at this street number and ZIP |
| Texas | 223-901-001 | BROWNFIELD ISD | BROWNFIELD, TX, 79316 | http://www.brownfieldisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 227-906-000 | TEXAS SCHOOL FOR THE DEAF | 1102 SOUTH CONGRESS AVENUE, AUSTIN, TX, 78704 | http://www.tsd.state.tx.us/ | — | listing Texas School for the Deaf (ChIJiT9SlgK1RIYRuD3J2e2uEpQ) was also proved for C2635 TEXAS SCHOOL FOR THE DEAF |
| Texas | 227-910-000 | DEL VALLE ISD | DEL VALLE, TX, 78617-3202 | http://dvhs.dvisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 236-950-000 | ESC REGION VI - PUBLIC | HUNTSVILLE, TX, 77340-6417 | http://www.esc6.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 236-950-106 | REGION VI ESC - PTDE | HUNTSVILLE, TX, 77340 | http://www.esc6.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 240-901-001 | LAREDO ISD | LAREDO, TX, 78040 | http://alltexdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | 249-903-001 | BRIDGEPORT ISD | ONE MAROON DR, BRIDGEPORT, TX, 76426 | http://www.wisedrivingschool.net/ | — | no candidate in this ZIP with the school's name |
| Texas | 250-905-000 | YANTIS ISD | YANTIS, TX, 75497-2725 | http://www.yantisisd.net/ | — | no candidate in this ZIP with the school's name |
| Texas | C0025 | ALL-STAR DRIVING SCHOOL | 12/29/2026, DALLAS, DALLAS | http://allstardrivingschools.net/ | — | ambiguous: 2 candidates pass (All Star Driving School Inc; All Star Driving School) |
| Texas | C0050 | BAY AREA DRIVING SCHOOL | 12/30/2026, BAYTOWN, HARRIS | https://www.bayareadriving.com/ | — | ambiguous: 3 candidates pass (Bay Area Driving School Inc; Bay Area Driving School; Bay Area Driving Academy) |
| Texas | C0094 | DRIVING SCHOOL OF THE SOUTHWEST | AMARILLO, TX, 79109-3008 | http://www.discounttrafficsurvivalschool.com/ | — | proved listing Driving School Of The Southwest has no website |
| Texas | C0124 | INTERSTATE DRIVING SCHOOL | SAN ANTONIO, TX, 78211-3200 | https://www.myimprov.com/defensive-driving/texas/tx-online-course/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | proved listing Interstate Driving School has no website |
| Texas | C0136 | LONE STAR DRIVING SCHOOL-YALE STREET | HOUSTON, TX, 77091-3202 | http://www.lonestardrivingschoolhouston.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C0141 | CENTRAL DRIVING SCHOOL | KILLEEN, TX, 76542-3350 | http://www.ctdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C0150 | MID-COAST DRIVING SCHOOL | BAY CITY, TX, 77414 | http://www.midcoastdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C0172 | RHODES DRIVING SCHOOL | 12/30/2026, SAN ANTONIO, BEXAR | http://rhodesdrivingschools.com/ | — | ambiguous: 5 candidates pass (Rhodes Driving School; Rhodes Driving School; Rhodes Driving Schools Inc; Rhodes Driving Schools Inc; Rhodes Driving School) |
| Texas | C0212 | TEXAS DRIVING SCHOOL | STE 107, KYLE, TX, 78640-4274 | https://www.texdds.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C0220 | TEXAS DRIVING SCHOOL | 1763 S GENERAL MCMULLEN DR, SAN ANTONIO, TX, 78237 | https://www.texdds.com/ | — | proved listing Texas Driving School has no website |
| Texas | C0243 | ROAD RULES DRIVING ACADEMY | LIVINGSTON, TX, 77351-3900 | http://roadrulesdrivingacademy.com/ | — | ambiguous: 2 candidates pass (Road Rules Driving Academy; ROAD RULES Driving Academy) |
| Texas | C0335 | INDEPENDENT DRIVING SCHOOL | ampus 2314 S Jefferson St Rm 122B, PERRYTON, TX, 79070 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate in this ZIP with the school's name |
| Texas | C0357 | TEXAS DRIVING SCHOOL | SAN ANTONIO, TX, 78238-4125 | https://www.texdds.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C0952 | JESUIT COLLEGE PREPARATORY SCHOOL OF DALLAS | 3/31/2026, DALLAS, DALLAS | http://www.jesuitdallas.org/ | — | no candidate with the school's name |
| Texas | C1119 | MAJOR LEAGUE DRIVING SCHOOL | 3/9/2027, TERRELL, KAUFMAN | http://www.majorleaguedriving.com/ | — | ambiguous: 2 candidates pass (Major League Driving School; Major League Driving School) |
| Texas | C1148 | COLONY/COURTESY DRIVING SCHOOL | KATY, TX, 77450-1431 | https://www.colonydrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C1286 | KATY DRIVING SCHOOL | 1/22/2027, Ste 450, KATY, FORT BEND | http://www.katydrivingschool.net/ | — | ambiguous: 2 candidates pass (Katy Driving School; SafeWay Driving Katy / Fulshear) |
| Texas | C1301 | LIBERTY DRIVING SCHOOL | HOUSTON, TX, 77072-2530 | http://www.libertydrivingschool.net/ | — | proved listing Liberty Driving School has no website |
| Texas | C1516 | SVM DRIVESAFE LLC DBA SVM DEFENSIVE DRIVING SCHOOL | EL PASO, TX, 79925-3341 | http://svmdrivingschooltx.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C1625 | TEXAS DRIVING SCHOOL | CORPUS CHRISTI, TX, 78411-2537 | https://www.texdds.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C1648 | CYPRESS DRIVING SCHOOL | 4/1/2027, MAGNOLIA, MONTGOMERY | https://cypressdrivingacademy.com/ | — | ambiguous: 3 candidates pass (Cypress Creek Driving School • Escuela de Manejo • Authorized Road Test; Cypress Driving Academy; Cypress Driving School) |
| Texas | C1719 | CHILD AND ADULT DEVELOPMENT CENTER OF HOUSTON | 4/2/2026, HOUSTON, HARRIS | https://houstontx.gov/courts/location-central.html | — | no candidate with the school's name |
| Texas | C1804 | GARY JOB CORPS | SAN MARCOS, TX, 78666-8861 | http://gary.jobcorps.gov/ | — | no candidate in this ZIP with the school's name |
| Texas | C1939 | ILA DRIVING SCHOOL | Ste 205F, HOUSTON, TX, 77036-2292 | http://www.iladrivingschool1.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C1988 | ALL AGES DRIVING SCHOOL-SOUTH EAST | PASADENA, TX, 77504-2755 | http://www.allagesdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2085 | D - C DRIVING SCHOOL | ASHERTON, TX, 78827-7152 | https://desidistrictdrivingschool.com/ | — | proved listing D - C Driving School has no website |
| Texas | C2229 | SAFE2DRIVE | SAN ANTONIO, TX, 78258-4321 | https://www.safe2drive.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2266 | APRENDA A MANEJAR | EL PASO, TX, 79930-3741 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C2283 | DRIVER ED IN A BOX | KATY, TX, 77494-1128 | http://driveredinabox.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2295 | HOUSTON DRIVING SCHOOL | HOUSTON, TX, 77035-2901 | http://www.comedydriving.com/defensive-driving-houston/ | — | no candidate in this ZIP with the school's name |
| Texas | C2334 | SUN DRIVING SCHOOL | 1011 JACKSON KELLER ROAD, SAN ANTONIO, TX, 78213 | http://www.suncitydriving.com/ | — | proved listing sun driving school has no website |
| Texas | C2386 | AMERICAN SAFETY COUNCIL | ORLANDO, FL, 32801-4339 | https://www.americansafetycouncil.com/ | — | listing American Safety Council, Inc. (ChIJSXW9Fft654gRsTGoSDzS6Q0) was also proved for 034 American Safety Council |
| Texas | C2395 | RIGHT START DRIVING SCHOOL | 4/21/2027, CARROLLTON, DALLAS | http://rightstartdrivingschool.com/ | — | ambiguous: 2 candidates pass (Right Start Driving School; Right Start Driving School) |
| Texas | C2461 | SUN CITY DRIVING SCHOOL - WEST | EL PASO, TX, 79912-3651 | http://suncitydrivingschoolwest.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2498 | U CAN 2 DRIVING SCHOOL | MERCEDES, TX, 78570 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2576 | A B DRIVING SCHOOL | PANTEGO, TX, 76013-6069 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2635 | TEXAS SCHOOL FOR THE DEAF | AUSTIN, TX, 78704-1728 | http://www.tsd.state.tx.us/ | — | listing Texas School for the Deaf (ChIJiT9SlgK1RIYRuD3J2e2uEpQ) was also proved for 227-906-000 TEXAS SCHOOL FOR THE DEAF |
| Texas | C2659 | MAVERICK DRIVING ACADEMY | 9/8/2026, BURLESON, JOHNSON | http://www.maverickdrivingacademy.com/ | — | ambiguous: 4 candidates pass (Maverick Driving Academy; Maverick Driving Academy; Maverick Driving Academy; Maverick Driving Academy) |
| Texas | C2673 | EXPRESS DRIVING SCHOOL | EDINBURG, TX, 78542-7768 | http://expressdrivingschooldallas.com/ | — | proved listing Express Driving School has no website |
| Texas | C2693 | NATIONAL DRIVER TRAINING INSTITUTE | LAKEWAY, TX, 78734-2613 | https://nationaldrivertraining.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2696 | 1ST CHOICE DRIVING ACADEMY | 4/23/2027, BROWNSVILLE, CAMERON | http://1stchoicedrivingacademy.net/ | — | ambiguous: 2 candidates pass (1st Choice Driving Academy; 1st Choice CDL Academy) |
| Texas | C2711 | DRIVER PROFESSIONAL SERVICES | HOUSTON, TX, 77057-5922 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2758 | JOYA DRIVING SCHOOL | HOUSTON, TX, 77083-6611 | http://rstdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2763 | BEST ECONOMICAL STUDENT TRAINING/DRIVING SCHOOL | HOUSTON, TX, 77028-4112 | http://www.driveyourbest.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2780 | PRECISION DRIVING ACADEMY | HORIZON CITY, TX, 79928 | http://www.pdacademy.net/ | — | no candidate in this ZIP with the school's name |
| Texas | C2787 | DRIVING BY LAWS | BUDA, TX, 78610 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2789 | BURLESON DRIVING ACADEMY | 7/9/2023, 209 NE WILSHIRE BLVD STE A, BURLESON, JOHNSON | http://www.burlesondriving.com/ | — | ambiguous: 2 candidates pass (Burleson Driving Academy LLC; Burleson Driving Academy) |
| Texas | C2808 | ED'S DRIVERS ED | 12/5/2024, MARBLE FALLS, BURNET | https://getdriversed.com/austin | — | ambiguous: 4 candidates pass (Get Drivers Ed; Get Drivers Ed; Get Drivers Ed; Get Drivers Ed) |
| Texas | C2816 | ROAD READY DRIVING SCHOOL | HOUSTON, TX, 77057-7698 | https://www.roadreadydrivingschooltx.com/ | — | listing Road Ready Driving School, Houston (ChIJiVmuMdvDQIYRAacNmH1y8P8) was also proved for C3679 ROAD-READY DRIVING SCHOOL |
| Texas | C2818 | MAMA STUBB DRIVING SCHOOL | HEMPSTEAD, TX, 77445 | http://www.streetsds.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2823 | QUICK LANE DRIVING SCHOOL | HOUSTON, TX, 77066-2957 | https://quickdriving.us/ | — | no candidate in this ZIP with the school's name |
| Texas | C2825 | VICTORIA EDUCATIONAL ASSOCIATES - DRIVER EDUCATION LLC | VICTORIA, TX, 77901-4149 | http://www.victoriaea.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2827 | COMMUNITY DRIVING SCHOOL | 3/1/2027, FORT WORTH, TARRANT | https://www.trafficstoptraining.com/ | — | ambiguous: 3 candidates pass (Community Driving School; Community Traffic Stop Training LLC; Community Alliance for Traffic Safety) |
| Texas | C2828 | THE DRIVE SCHOOL | DALLAS, TX, 75209-2820 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C2838 | EASY STREET DRIVING SCHOOL | 6448 E HWY 290 E SUITE C100, AUSTIN, TX, 78723 | https://easydriversed.com/ | — | no candidate at this street number and ZIP |
| Texas | C2874 | CY FAIR DRIVING SCHOOL | 9/26/2027, HOUSTON, HARRIS | http://www.cyfairdrivingschool.com/ | — | ambiguous: 5 candidates pass (Cy Fair Driving School; Cy Fair Driving School; CY FAIR DRIVING SCHOOL TXFINITY KATY; CY Fair Driving School; Cy-Fair Driving School) |
| Texas | C2891 | AVA DRIVING SCHOOL LLC | EDINBURG, TX, 78539-4510 | https://avadrivedrivingschool.co.uk/ | — | no candidate in this ZIP with the school's name |
| Texas | C2919 | FRIO-DRAW DRIVING SCHOOL | HEREFORD, TX, 79045-3042 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3007 | CYPRESS CREEK DRIVING ACADEMY | HOUSTON, TX, 77070-6314 | http://cypresscreekdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3025 | COACH B'S STUDENT DRIVING | DE LEON, TX, 76444-1949 | https://coachdeedrivereducationalschoo.godaddysites.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3037 | LTD DRIVING SCHOOL | 4/18/2027, MCALLEN, HIDALGO | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | ambiguous: 2 candidates pass (LTD Driving School - Driving Lessons Driver Education; Dallas Adult Driving School) |
| Texas | C3042 | NATIONAL HIGHWAY SAFETY ADMINISTRATION LLC | EL PASO, TX, 79935-3109 | http://www.nise.co/ | — | no candidate in this ZIP with the school's name |
| Texas | C3044 | 3-WAY INSTRUCTION | 5/24/2025, HUMBLE, HARRIS | https://tx.novadriving.com/ | — | no candidate with the school's name |
| Texas | C3045 | BEST CHOICE DRIVING SCHOOL | PFLUGERVILLE, TX, 78660-5331 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate in this ZIP with the school's name |
| Texas | C3052 | EP E-Z DRIVING SCHOOL | EL PASO, TX, 79936-3419 | https://www.ezlicensefl.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3058 | RST MOBILITY SERVICES | LA JOYA, TX, 78560-9083 | https://rstdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3064 | A+ ACADEMY DRIVING SCHOOL | 12/6/2026, ARLINGTON, TARRANT | https://www.a-plus-academy-driving-school.com/ | — | ambiguous: 3 candidates pass (A+ Academy Driving School; A+ Academy Driving School; A Plus Driving Academy) |
| Texas | C3118 | SAFEKEYS DRIVING SCHOOL | HOUSTON, TX, 77084-4067 | http://www.safekeysdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3130 | DRIVE AUTO DRIVING SCHOOL | MCKINNEY, TX, 75069 | https://driveautodrivingschool.us/ | — | no candidate in this ZIP with the school's name |
| Texas | C3133 | 1-STREET WISE DRIVING SCHOOLS INC | GRAND PRAIRIE, TX, 75051-4806 | http://www.streetwisedrivingschools.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3151 | I TEACH DRIVE | HOUSTON, TX, 77066 | http://www.iteachdrive.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3163 | HURST EULESS BEDFORD DRIVING SCHOOL | BEDFORD, TX, 76021 | https://hebdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3166 | ONE OF A KIND DRIVING SCHOOL | HOUSTON, TX, 77028-2007 | https://oneofakinddrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3198 | STONEPOINT DRIVING SCHOOL | CEDAR PARK, TX, 78613-2189 | http://driverspointdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3200 | COMEDYDRIVINGCOMPANY.COM | MILPITAS, CA, 95035-7014 | http://www.comedydriving.com/defensive-driving-houston/ | — | no candidate in this ZIP with the school's name |
| Texas | C3204 | ISLAND DRIVING SCHOOL | 2329 PALMER HWY, TEXAS CITY, TX, 77590 | https://www.islanddrivingschoolllc.com/ | — | listing Island Driving School LLC (ChIJpbgNNqJ5P4YR3l5U91x-CvQ) was also proved for C3507 ISLAND DRIVING SCHOOL LLC |
| Texas | C3212 | TEXAS DRIVING SCHOOL | SAN ANTONIO, TX, 78212 | https://www.texdds.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3221 | ALL-TEX DRIVING ACADEMY LLC | LAREDO, TX, 78041-6528 | http://alltexdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3223 | CAR TEEN | KATY, TX, 77450-8599 | https://aasmartdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3241 | AAA DRIVING SCHOOL | COPPELL, TX, 75019-4413 | https://aasmartdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3252 | EASY DRIVERS ED | TYLER, TX, 75701 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3256 | REFLEX DRIVING SCHOOL | HOUSTON, TX, 77028-1201 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C3276 | HUTTO DRIVING SCHOOL LLC | HUTTO, TX, 78634-4092 | http://www.huttodrivingschool.com/ | — | listing Hutto Driving School (ChIJBwxth6jbRIYRuXplhHrl97U) was also proved for C3688 HUTTO DRIVING SCHOOL |
| Texas | C3284 | KINGS AND QUEENS DRIVING SCHOOL | HOUSTON, TX, 77015 | https://www.tkdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3285 | EASY TEXAS DRIVERS ED | MILPITAS, CA, 95035-7014 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3293 | UNCLE JOE DRIVING SCHOOL | RICHMOND, TX, 77406 | http://unclejoedrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3296 | AFFORDABLE ONLINE TEXAS COURSE | ROSENBERG, TX, 77471-3954 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3297 | FAST DRIVING COURSE | MILPITAS, CA, 95035-7014 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate in this ZIP with the school's name |
| Texas | C3317 | AGHA DRIVING SCHOOL | HOUSTON, TX, 77057-5103 | https://gazidrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3323 | AS DRIVER EDUCATION | ANN ARBOR, MI, 48108-2705 | https://getdriversed.com/dallas | — | no candidate in this ZIP with the school's name |
| Texas | C3330 | AUTOMATICO DRIVING SCHOOL | GARLAND, TX, 75043-4096 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C3332 | QUICK DRIVING SCHOOL | IRVING, TX, 75062-1954 | https://quickdriving.us/ | — | no candidate in this ZIP with the school's name |
| Texas | C3339 | STEER CLEAR DRIVING SCHOOL | HOUSTON, TX, 77090 | http://straightforwarddriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3350 | IGOTTADRIVE.COM | RICHMOND, TX, 77407-1102 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate in this ZIP with the school's name |
| Texas | C3353 | TYLER ROSE DRIVING CENTER | TYLER, TX, 75701-5869 | http://www.tylerrosedrivingcenter.com/ | — | listing Tyler Rose Driving Center (ChIJ38NOMH3NSYYRbaoGT5Rm-5g) was also proved for C3498 TYLER DRIVING SCHOOL |
| Texas | C3361 | 30 DOLLAR ONLINE DRIVERS ED | MILPITAS, CA, 95035-7014 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3362 | TEXAS APPROVED DRIVING SCHOOL | MILPITAS, CA, 95035-7014 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C3363 | LONE STAR STATE DRIVERS ED | MILPITAS, CA, 95035-7014 | https://lonestardrivingacademy.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3364 | EZADULTDRIVERSED.COM | MILPITAS, CA, 95035-7014 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3365 | BEST ONLINE DRIVERS ED | MILPITAS, CA, 95035-7014 | https://getdriversed.com/dallas | — | no candidate in this ZIP with the school's name |
| Texas | C3367 | ALWAYS DRIVE SAFE DRIVING SCHOOL | GARLAND, TX, 75043-2369 | https://alwaysdrivesafedrivingschool.godaddysites.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3369 | LAREDO DRIVING SCHOOL | RIO BRAVO, TX, 78046-8611 | http://alltexdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3389 | SWEET CHARIOT PRODUCTIONS LLC | DWG, TX, 76013-5902 | https://www.sweetchariotdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3392 | TOP NOTCH DRIVING SCHOOL | 315 E AVENUE G, KILLEEN, TX, 76541 | https://www.brutondrivingschool.com/ | — | no candidates |
| Texas | C3415 | PASS DRIVERS ED LLC | PEWAUKEE, WI, 53072-3468 | https://onewaydrivingsmtx.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3416 | HALLMARK DRIVING ACADEMY | MOODY, TX, 76557 | https://marksdrivingacademy.com/home/ | — | no candidate in this ZIP with the school's name |
| Texas | C3422 | HD DRIVING SCHOOL | ROUND ROCK, TX, 78681-5055 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3423 | SOTO'S DRIVING SCHOOL | 9/4/2026, DEL RIO, VAL VERDE | https://desotodrivingschool.com/ | — | listing DeSoto Driving School LLC (ChIJC-8fBJeTToYRflLCFqLJITg) was also proved for C3432 DESOTO DRIVING SCHOOL |
| Texas | C3424 | NEXT DOOR DRIVING INC | FOLSOM, CA, 95630-8013 | http://www.nextdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3427 | SPIDER DRIVERS ED | WOODLAND HILLS, CA, 91367 | https://driverz.com/driving-schools-houston?UTM_source=GMB_listing&UTM_medium=organic | — | no candidate in this ZIP with the school's name |
| Texas | C3429 | GET DRIVERS ED | AUSTIN, TX, 78753-1030 | https://getdriversed.com/dallas | — | no candidate in this ZIP with the school's name |
| Texas | C3432 | DESOTO DRIVING SCHOOL | DESOTO, TX, 75115-5758 | https://desotodrivingschool.com/ | — | listing DeSoto Driving School LLC (ChIJC-8fBJeTToYRflLCFqLJITg) was also proved for C3423 SOTO'S DRIVING SCHOOL |
| Texas | C3436 | ZENO'S A1 DRIVING SCHOOL | HOUSTON, TX, 77021-2814 | http://a1drivingschoolllc.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3442 | SAFEWAY DRIVING | HOUSTON, TX, 77024 | https://www.saferoutedriving.com/ | — | listing SafeWay Driving Memorial (ChIJJd5CuonEQIYRYOKU_If2Mos) was also proved for C3656 SAFEWAY DRIVING |
| Texas | C3451 | DPS DRIVING SCHOOL | DALLAS, TX, 75240-8980 | https://dpsmobiledrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3453 | MONROY DRIVING SCHOOL - MEMORIAL LLC | HOUSTON, TX, 77079-1604 | https://www.houstonroadtest.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3468 | DRIVE PREP LLC | 22762 WESTHEIMER PKWY BLDG D STE 505, KATY, TX, 77450 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | proved listing Drive Prep LLC has no website |
| Texas | C3474 | SAFE ROUTE DRIVING SCHOOL | 2/27/2027, IRVING, DALLAS | https://saferoutedriving.com/ | — | ambiguous: 2 candidates pass (Safe Route Driving School; Safe Route Driving School) |
| Texas | C3496 | S & R TRUCKING DRIVING INSTITUTE | HOUSTON, TX, 77060-3592 | http://srtdi.org/ | — | no candidate in this ZIP with the school's name |
| Texas | C3498 | TYLER DRIVING SCHOOL | TYLER, TX, 75701-9660 | http://www.tylerrosedrivingcenter.com/ | — | listing Tyler Rose Driving Center (ChIJ38NOMH3NSYYRbaoGT5Rm-5g) was also proved for C3353 TYLER ROSE DRIVING CENTER |
| Texas | C3499 | THREE LAKES DRIVING SCHOOL | BURNET, TX, 78611-3748 | https://3lakesdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3501 | DALLAS DRIVING SCHOOL | Suite 124B, DALLAS, TX, 75214 | http://www.dallasdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3505 | ELITE DRIVING ACADEMY LLC | DALLAS, TX, 75228 | https://www.elitedriving.academy/ | — | no candidate in this ZIP with the school's name |
| Texas | C3507 | ISLAND DRIVING SCHOOL LLC | TEXAS CITY, TX, 77590-7141 | https://www.islanddrivingschoolllc.com/ | — | listing Island Driving School LLC (ChIJpbgNNqJ5P4YR3l5U91x-CvQ) was also proved for C3204 ISLAND DRIVING SCHOOL |
| Texas | C3508 | SAFE2DRIVE | STE 375, SAN ANTONIO, TX, 78258-4073 | https://www.safe2drive.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3509 | AUTOMOTIVE EDUCATION LLC | HOUSTON, TX, 77068-3615 | http://www.automotiveeducation.org/ | — | no candidate in this ZIP with the school's name |
| Texas | C3510 | CYPRESS DRIVING ACADEMY | 8/23/2027, Suite E7, CYPRESS, HARRIS | https://cypressdrivingacademy.com/ | — | ambiguous: 2 candidates pass (Cypress Driving Academy; Cypress Driving Academy) |
| Texas | C3517 | RICHMOND DRIVING ACADEMY | SUGAR LAND, TX, 77479-4988 | https://rdrivingacademy.ca/ | — | proved listing Richmond Driving Academy has no website |
| Texas | C3519 | PARENTTAUGHTDRIVINGCOURSE.COM | AUSTIN, TX, 78758-4965 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3520 | IDS BAYTOWN-STAFFORD | Suite F, BAYTOWN, TX, 77521-2349 | https://islanddrivingschoolbaytown.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3521 | TOP CHOICE DRIVERS ED | COLMESNEIL, TX, 75938-4059 | http://1stchoicedrivingacademy.net/ | — | no candidate in this ZIP with the school's name |
| Texas | C3524 | TEXASPARENTTAUGHTDRIVERSED.COM | AUSTIN, TX, 78717-4410 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3525 | TEENPARENTTAUGHTDRIVERSED.COM | CORPUS CHRISTI, TX, 78413 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3527 | TEXASTEENDRIVINGCOURSE.COM | PMB 1007, EL PASO, TX, 79901 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3528 | $29.95 COMEDY DRIVING PTDE | HOUSTON, TX, 77079 | http://www.comedydriving.com/defensive-driving-houston/ | — | no candidate in this ZIP with the school's name |
| Texas | C3529 | 29.95 FUNNY DRIVING PARENT TAUGHT DRIVERS ED | HOUSTON, TX, 77079-2207 | https://funnydriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3530 | CAR TEEN | KATY, TX, 77450-8599 | https://aasmartdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3531 | AMERICA'S DRIVERS ED | COLMESNEIL, TX, 75938-4059 | https://www.driverseducationofamerica.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3532 | FIRST STEP DRIVING SCHOOL | CARROLLTON, TX, 75006-7455 | http://safety1drivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3533 | PARENTTAUGHTDRIVER.COM | SAN ANTONIO, TX, 78216-7764 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3534 | TEXASPARENTTAUGHTDRIVINGCOURSE.COM | HOUSTON, TX, 77066-3841 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3535 | AFFORDABLEPARENTTAUGHTDRIVERSED.COM | PLANO, TX, 75093-5423 | https://www.25texasdefensivedriving.com/contact-us | — | no candidate in this ZIP with the school's name |
| Texas | C3536 | DRIVING SCHOOL 4 ME | FORT WORTH, TX, 76135-2607 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3537 | PARENT TAUGHT DRIVERS ED LLC | SAN ANTONIO, TX, 78223-1404 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3539 | PARENTTAUGHT.COM | STE 100, AUSTIN, TX, 78731 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3542 | EZPARENTTAUGHTDRIVERSED.COM | LEANDER, TX, 78641-8564 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3543 | DRIVINGQUEST | MCALLEN, TX, 78504-2713 | https://drivingquest.com/?utm_source=google&utm_medium=organic&utm_campaign=gmb | — | no candidate in this ZIP with the school's name |
| Texas | C3544 | 2 COOL 4 DRIVING SCHOOL | AMARILLO, TX, 79108-7572 | https://2cool4drivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3545 | AMERICAN DRIVERS ED LLC | HOUSTON, TX, 77095-7229 | https://www.driverseducationofamerica.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3547 | DRIVERSIDE LLC | FRIENDSWOOD, TX, 77546-2465 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3548 | PARENTTAUGHT101.COM | DALLAS, TX, 75201-4529 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3551 | TEXASTEENDRIVINGSCHOOL.COM | AUSTIN, TX, 78749-3684 | https://www.texdds.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3553 | ISLAND DRIVING SCHOOL AT GALVESTON | GALVESTON, TX, 77550-7359 | https://islanddrivingschools.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3554 | DRIVING TRAINING SCHOOL | DALLAS, TX, 75244 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate in this ZIP with the school's name |
| Texas | C3557 | PREPARED TEENS | ROUND ROCK, TX, 78665-2829 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3559 | 30DOLLARPTDE.COM | KYLE, TX, 78640-4010 | http://www.trafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3561 | ONLINE DRIVING PROFESSOR | CYPRESS, TX, 77429-6956 | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate in this ZIP with the school's name |
| Texas | C3562 | MAGNOLIA MONTGOMERY COUNTY DRIVERS ED | MAGNOLIA, TX, 77354 | http://magnoliadriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3564 | BEEHIVE THE WHEEL DRIVING SCHOOL | EL PASO, TX, 79925-6032 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C3566 | FAST EASY DRIVERS ED | MCKINNEY, TX, 75071-3279 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3567 | GO TO DRIVERS ED | LUBBOCK, TX, 79424-4999 | https://getdriversed.com/dallas | — | no candidate in this ZIP with the school's name |
| Texas | C3568 | STATE APPROVED DRIVERS ED | FRISCO, TX, 75034-9586 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3570 | EASY TEEN DRIVERS ED | PASADENA, TX, 77503-3823 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3575 | MR.SAFETY DRIVING SCHOOL | MISSOURI CITY, TX, 77459-5225 | http://www.comedydriving.com/defensive-driving-houston/ | — | no candidate in this ZIP with the school's name |
| Texas | C3583 | LSKV DRIVING SCHOOL LLC | Suite 211C, AUSTIN, TX, 78750 | https://lskvdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3584 | MIT 1ST PRIORITY DRIVING SCHOOL LLC | CHANNELVIEW, TX, 77530-3513 | https://1stprioritydriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3586 | MYDRIVINGCOURSE.COM | CARROLLTON, TX, 75007-2620 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3588 | TICKETSCHOOL.COM | Unit C, SUGAR LAND, TX, 77479-7153 | https://ticketschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3590 | HANDSONWHEEL DRIVING SCHOOL | IRVING, TX, 75062-1954 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3591 | MANEJASEGURO LLC | HOUSTON, TX, 77036 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3593 | TEXAN DRIVER | AUSTIN, TX, 78739-5732 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3594 | PROKENT DRIVING ACADEMY | DAYTON, TX, 77535-2632 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3595 | DRIVING LOGIC INC | Suite 101-244, JACKSONVILLE, FL, 32216-1177 | http://www.trafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3596 | DWAY DRIVING SCHOOL | Suite 400B, HOUSTON, TX, 77060-2402 | http://www.onewaydrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3599 | EASY PARENT TAUGHT DRIVERS ED | AUSTIN, TX, 78731-3064 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3600 | TRUSTED PARENT TAUGHT COURSE | AUSTIN, TX, 78731-3064 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C3601 | PARENTTAUGHTONLINE.COM | AUSTIN, TX, 78731-3064 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3602 | PARENTTAUGHTCOURSE.COM | AUSTIN, TX, 78731-3064 | https://parenttaughtdriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3603 | PARENT TAUGHT COMPLETE COURSE | AUSTIN, TX, 78731-3064 | https://frostdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3604 | FAST BRAKE DRIVING ACADEMY LLC | Suite 262, SAN ANTONIO, TX, 78229-5142 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3605 | EASY DRIVING SCHOOL | BUDA, TX, 78610-9361 | https://easydriversed.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3606 | KINGS OF KATY LOGISTICS LLC | HOUSTON, TX, 77079-1317 | http://www.kingcdlacademy.net/ | — | no candidate in this ZIP with the school's name |
| Texas | C3608 | ARTHURS DRIVING ACADEMY LLC | HOUSTON, TX, 77015-4960 | http://arthursdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3611 | DAD'S DRIVING SCHOOL PLLC | LITTLE ELM, TX, 75068-4883 | http://www.comedydriving.com/defensive-driving-houston/ | — | no candidates |
| Texas | C3621 | I 1 2 DRIVE | 3/25/2026, MISSION, HIDALGO | https://www.safe2drive.com/ | — | no candidate with the school's name |
| Texas | C3622 | LAKE HOUSTON DRIVERS ONLINE EDUCATION LLC | HOUSTON, TX, 77220-5291 | https://www.myimprov.com/traffic-school/texas/houston/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate in this ZIP with the school's name |
| Texas | C3624 | MARTINEZ DRIVING ACADEMY | EAGLE PASS, TX, 78852-3480 | https://www.facebook.com/mtzdrivingschool | — | proved listing Martinez Driving Academy has no website |
| Texas | C3631 | SAFEWAY DRIVING | KATY, TX, 77494-1146 | https://www.saferoutedriving.com/ | — | listing SafeWay Driving Katy / Fulshear (ChIJa-7M1DskQYYR2eflAQSnj04) was also proved for C3691 SAFEWAY DRIVING |
| Texas | C3635 | NOVA DRIVING SCHOOL TX LLC | HUMBLE, TX, 77346-1831 | https://tx.novadriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3639 | SAFEWAY DRIVING | BELLAIRE, TX, 77401-3967 | https://www.safewaydriving.com/locations/memorial/pricing | — | no candidate in this ZIP with the school's name |
| Texas | C3641 | IDRIVE ACADEMY LLC | Suite 100, MONTGOMERY, TX, 77316-4017 | https://www.idrivebr.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3643 | DLR DRIVING SCHOOL LLC | EDINBURG, TX, 78542 | https://www.dlrdrivingschool.com/ | — | ambiguous: 2 candidates pass (DLR DRIVING SCHOOL CORPORATE OFFICE; DLR DRIVING SCHOOL) |
| Texas | C3646 | XLR8 EDUCATION SERVICES | WACO, TX, 76710 | https://xlr8drivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3647 | TU LICENCIA EN ESPANOL LLC | SUITE D, HOUSTON, TX, 77084-5641 | http://www.tulicenciaenespanol.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3652 | SAFETY DRIVING SCHOOL LLC | PLANO, TX, 75023-7020 | https://www.trafficsafetyinstitute.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3653 | NEXTGEN DRIVING ACADEMY LLC | ROCKPORT, TX, 78382-2517 | https://nexgendrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3655 | THE UNIVERSITY OF DRIVING | MURPHY, TX, 75094-4582 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3656 | SAFEWAY DRIVING | Suite 105, HOUSTON, TX, 77024 | https://www.saferoutedriving.com/ | — | listing SafeWay Driving Memorial (ChIJJd5CuonEQIYRYOKU_If2Mos) was also proved for C3442 SAFEWAY DRIVING |
| Texas | C3658 | DEAN LEGACY ENTERPRISES LLC | WHARTON, TX, 77488-5008 | http://www.defensivedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3660 | ONE WAY DRIVING SCHOOL OPERATING LLC | SAN MARCOS, TX, 78666-6681 | https://onewaydrivingsmtx.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3661 | CHANGING LANES DRIVING SCHOOL LLC | HUNTSVILLE, TX, 77340 | https://www.changinglanesdriversed.com/services.html | — | proved listing Changing Lanes Driving School LLC has no website |
| Texas | C3662 | SAFEWAY DRIVING | DALLAS, TX, 75225 | https://www.saferoutedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3664 | EVERTIX | PEARLAND, TX, 77581 | https://www.25texasdefensivedriving.com/contact-us | — | no candidate in this ZIP with the school's name |
| Texas | C3665 | DRIVING SCHOOL OF RED OAK | RED OAK, TX, 75154 | http://www.redoakdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3667 | KD'S DRIVING INSTRUCTION LLC | DAYTON, TX, 77535 | http://www.comedydriving.com/defensive-driving-houston/ | — | no candidate in this ZIP with the school's name |
| Texas | C3670 | THE MILE CO | VENUS, TX, 76084 | https://www.mileschoolofdriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3672 | SEB'S DRIVING SCHOOL | DALLAS, TX, 75203 | http://www.sebsdriving.academy/ | — | no candidate in this ZIP with the school's name |
| Texas | C3674 | LEARN AND PERMITS | 2/25/2027, #29318, AUSTIN, TRAVIS | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3678 | SAFEX DRIVING SCHOOL | KATY, TX, 77449 | https://www.urbantrafficschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3679 | ROAD-READY DRIVING SCHOOL | 4/16/2027, DALLAS, DALLAS | https://www.roadreadydrivingschooltx.com/ | — | listing Road Ready Driving School, Houston (ChIJiVmuMdvDQIYRAacNmH1y8P8) was also proved for C2816 ROAD READY DRIVING SCHOOL |
| Texas | C3680 | STERLING'S ELITE DRIVING ACADEMY | 310, HOUSTON, TX, 77060 | https://www.elitedriving.academy/ | — | no candidate in this ZIP with the school's name |
| Texas | C3681 | NEXUS DRIVERS ED LLC | PLANO, TX, 75025 | https://thenexusdrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3682 | DRIVINGWALA SCHOOL LLC | KATY, TX, 77450 | https://www.wirelessdefensivedriving.com/ | — | proved listing Drivingwala Driving School has no website |
| Texas | C3683 | SAFEWAY DRIVING | MISSOURI CITY, TX, 77459 | https://www.saferoutedriving.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3686 | CITYWIDE DRIVING SCHOOL LLC | LANCASTER, TX, 75146 | http://citydrivedrivingschool.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3687 | GO TO DRIVERS ED | HOUSTON, TX, 77084 | http://learntodriveaz.com/ | — | no candidate in this ZIP with the school's name |
| Texas | C3688 | HUTTO DRIVING SCHOOL | HUTTO, TX, 78634 | http://www.huttodrivingschool.com/ | — | listing Hutto Driving School (ChIJBwxth6jbRIYRuXplhHrl97U) was also proved for C3276 HUTTO DRIVING SCHOOL LLC |
| Texas | C3689 | DRIVABLE ED | RICHARDSON, TX, 75080 | https://defensivedrivingcourse.com/?utm_source=GMB | — | no candidate in this ZIP with the school's name |
| Texas | C3691 | SAFEWAY DRIVING | KATY, TX, 77494 | https://www.saferoutedriving.com/ | — | listing SafeWay Driving Katy / Fulshear (ChIJa-7M1DskQYYR2eflAQSnj04) was also proved for C3631 SAFEWAY DRIVING |
| Texas | C3693 | SAFEWAY DRIVING | COLLEGE STATION, TX, 77845 | https://www.saferoutedriving.com/ | — | no candidate in this ZIP with the school's name |
| Utah | UT-approved | DriveFit Inc | Weber County | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Utah | UT-approved | A-1 Driving | Salt Lake County, Weber County, Utah County | http://www.a-1drivingschool.com/ | — | ambiguous: 5 candidates pass (A-1 Driving School; A-1 Driving School; A-1 Driving School; A-1 Driving School; A-1 Driving School) |
| Virginia | VA-approved | http://greenmeansgova.com | — | https://www.dmv.virginia.gov/licenses-ids/improvement/clinics | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.CheapDrivingClinic.com | — | http://www.cheapdrivingclinic.com/contact.php | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.akjdrivingschool.com | — | https://akjdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.abcdrivingcourse.com | — | http://www.abcdrivingclinic.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.a-plusdriving.com | — | https://www.aaplusdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.adjdriverimprovement.com | — | http://www.dicourse.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.enhtactical.com | — | https://www.dmv.virginia.gov/licenses-ids/improvement/clinics | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.udriveva.com | — | https://www.udriveva.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.abigailsdrivingschool.com | — | https://unrivaled-wisp-97dc95.netlify.app/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.revodrivingschool.com | — | http://revodrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.aimhighdrivingschool.com | — | https://aimhighdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.drivereducate.com | — | http://www.virginiadriverimprovementcliniconline.com/contact-us.php | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.spanishdriving.com | — | http://www.spanishdriving.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://2020drivingschool.com | — | https://2020drivingschool.com/?utm_source=google&utm_medium=organic | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.driverimprovementonlineva.net | — | http://www.virginiaonlinedriverimprovement.com/contact-us/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.qualitydrivingva.com | — | http://www.qualitydrivingva.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.onewaydrivingva.com | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.cheapeasyfastva.com | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Virginia | VA-approved | http://veteransdriving.com | — | http://www.veteransdriving.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.vpdriverimprovement.com | — | http://learntodriveaz.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://soyouthinkyoucandriveva.com | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.nestdrivingschool.com | — | https://nestdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.driverimprovementonlineva.com | — | https://www.myimprov.com/defensive-driving/arizona?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.virginiadriverimprovementonline.com | — | http://www.virginiaonlinedriverimprovement.com/contact-us/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://trafficschoolonline.com/state/virginia-driver-improvement | — | http://www.virginiaonlinedriverimprovement.com/contact-us/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://coulsonservices.com | — | http://coulsonservices.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://acarclinic.com | — | https://www.dmv.virginia.gov/licenses-ids/improvement/clinics | — | no candidate with the school's name |
| Virginia | VA-approved | http://brakethrudriving.com | — | http://learntodriveaz.com/ | — | no candidates |
| Virginia | VA-approved | http://ameerdrivingschoolllc.com | — | https://www.ameerdrivingschoolllc.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.majordriverimprovementclinic.com | — | https://www.dmv.virginia.gov/licenses-ids/improvement/clinics | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.gothespeedlimit.com | — | http://www.gothespeedlimit.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://drivingteacherrva.org | — | http://learntodriveaz.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://axisdrivingacademy.com | — | https://axisdrivingacademy.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://5dollartrafficschool.com/Virginia/Driver-Improvement-Clinic-Course/regis… | — | http://www.virginiaonlinedriverimprovement.com/contact-us/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://paragondrivingschools.com | — | https://paragondrivingschools.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.advantagedriveraplus.net | — | http://www.advantagedriveraplus.net/location/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://--- | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://valleydrivered.com | — | http://www.valleydrivered.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://moses09drivingschool.com | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://ww.coachissamsdrivingschool.com | — | http://coachissamsdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.adaptdriving.com | — | http://www.dicourse.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://apex-drivingschool.com | — | https://apex-drivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://1destinationdriverimprovement.com | — | http://1destinationdriverimprovement.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.sadriving.com | — | https://www.sadriving.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.ablueskydrivingacademy.com | — | https://www.rvatrafficschool.com/ | — | no candidates |
| Virginia | VA-approved | http://www.tricitydrive.com | — | http://tricitydrive.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.saferoaddrivingacademy.com | — | http://www.saferoaddrivingacademy.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://dinwiddiedrivingschool.com | — | http://dinwiddiedrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://accesstodrive.com | — | http://learntodriveaz.com/ | — | no candidates |
| Virginia | VA-approved | http://www.1010drivingschool.com | — | https://1010drivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.ourfamilydrivingschool.com | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.sakersdrivingschool.com | — | http://sakersdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.aaplusdrivingschool.com | — | https://www.aaplusdrivingschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.achievedrivingis.com | — | http://www.achievedrivingis.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://myvadrivers.com | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://agiledsva.com | — | http://agiledsva.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | Reset all | — | http://driveallround.com/ | — | no candidate with the school's name |
| Virginia | VA-approved | http://www.achieverplusonline.com | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Virginia | VA-DIC | A+ Driving School, LLC | — | http://www.a-plusdriving.com | — | ambiguous: 5 candidates pass (A Plus Driving School LLC; AA Plus Driving School; A Plus Driving School, LLC; A Plus Driver Improvement School; A AAA RVA Traffic School) |
| Virginia | VA-DIC | Road Ready Driving Academy | — | http://www.roadreadynow.net | — | no candidate with the school's name |
| Virginia | VA-DIC | A Plus Driving School | — | http://www.vadrivingcourses.com | — | ambiguous: 5 candidates pass (AA Plus Driving School; A Plus Driving School LLC; A Plus Driving School \| Va Driving Courses; A Plus Driving School, LLC; A Plus Driver Improvement School) |
| Virginia | VA-DIC | TK Driver Training School LLC | — | http://tkdrivertrainingschool.com | — | no candidate with the school's name |
| Virginia | VA-DIC | A & A "24/7" Online Virginia Driver Improvement | — | http://www.ineedaclass.com | — | no candidate with the school's name |
| Virginia | VA-DIC | Arete C4K Driving School | — | http://aretedrivingschool.godaddysites.com | — | no candidate with the school's name |
| Virginia | VA-DIC | DriveSafeToday.com, Inc. | — | http://www.drivesafetoday.com/courses/virginia | — | no candidate with the school's name |
| Virginia | VA-DIC | Fun Driving Clinic | — | http://www.FunDrivingClinic.com | — | no candidate with the school's name |
| Virginia | VA-DIC | DriveSafe Online | — | http://www.drivesafeonline.org/virginia/driver-improvement/ | — | no candidate with the school's name |
| Virginia | VA-DIC | Webb's Wheels Driving Academy LLC | — | http://online.webbswheelsda.com | — | ambiguous: 2 candidates pass (Webb’s Wheels Driving Academy LLC; Webb’s Wheels Driving Academy LLC) |
| Virginia | VA-DIC | Axis Driving Curriculum, LLC | — | http://www.axisdrivingcourses.com | — | no candidate with the school's name |
| Virginia | VA-DIC | Driver Improvement Program of Virginia | — | http://www.dipofva.com | — | no candidate with the school's name |
| Virginia | VA-DIC | U Drive Bilingual Driving School LLC | — | http://udrivevirginia.com | — | ambiguous: 2 candidates pass (U Drive Bilingual Driving School LLc; U Drive Bilingual Driving School LLC) |
| Virginia | VA-DIC | AAA1 American Institute for Public Safety | — | http://www.myimprov.com/defensive-driving/virginia/ | — | no candidate with the school's name |
| Virginia | VA-DIC | A & A 1 A ACAR Driver Clinic.com | — | http://acarclinic.com | — | no candidates |
| Virginia | VA-DIC | Ability Driving School LLC | — | https://www.rvatrafficschool.com/ | — | no candidate with the school's name |
| Virginia | VA-DIC | Highway Driving School LLC | — | http://highwaydrivingschoolva.com | — | no candidate with the school's name |
| Virginia | VA-DIC | A Blue Sky Driving Academy | — | http://www.ablueskydrivingacademy.com | — | no candidate with the school's name |
| Virginia | VA-DIC | DriveClear, LLC | — | http://driveclear.net | — | no candidate with the school's name |
| Virginia | VA-DIC | Easy Driver Improvement | — | http://www.virginiaonlinedriverimprovement.com | — | no candidate with the school's name |
| Virginia | VA-DIC | Blackstone Driving School | — | http://www.blackstonedrivingschool.com | — | ambiguous: 2 candidates pass (Blackstone Driving School; Blackstone Driving School) |
| Virginia | VA-DIC | Jesus Takes The Wheel Driving Academy | — | http://www.jttwdrivingacademy.com | — | no candidate with the school's name |
| Virginia | VA-DIC | ABC Driving Improvement LLC | — | http://www.abcdrivingcourse.com | — | no candidate with the school's name |
| Virginia | VA-DIC | Green Means Go Driver Improvement, LLC | — | http://greenmeansgova.com | — | no candidates |
| Virginia | VA-DIC | Albemarle County Public Schools Community Education | — | http://opendoors.digitalsignup.com | — | no candidate with the school's name |
| Virginia | VA-DIC | Valley Driving School | — | http://valleydrivered.com | — | ambiguous: 3 candidates pass (Valley Driving School; Shenandoah Valley Driving School, Inc.; Roanoke Valley Driver Training School) |
| Washington | WA-approved | Course type: Self-paced online; English and Spanish | — | https://www.nelsondrivingschool.com | — | no candidate with the school's name |
| Washington | WA-approved | Course type: In-person | — | http://driverstrainingacademy.com/ | — | no candidate with the school's name |
| Washington | WA-approved | Course type: In-person/Virtual | — | https://www.passdriversed.com | — | no candidate with the school's name |
| Washington | WA-approved | Course type: In-person | — | http://driverstrainingacademy.com/ | — | no candidate with the school's name |
| Washington | WA-approved | Course type: Virtual | — | https://www.drivesafe.com/washington-safe-driving-course/ | — | no candidate with the school's name |
| Washington | WA-approved | List of providers | — | http://www.eadrivingschool.com/ | — | no candidate with the school's name |
| Washington | WA-approved | Course type: Self-paced online | — | https://www.drivingtraining.net/ | — | no candidate with the school's name |
| Washington | WA-approved | Need more help? | — | https://www.urbantrafficschool.com/ | — | no candidate with the school's name |
| Washington | WA-approved | Course type: Self-paced online | — | https://start.bestonlinetrafficschool.co/sign-up/?utm_source=google&utm_medium=local&utm_campaign=gmb | — | no candidate with the school's name |
