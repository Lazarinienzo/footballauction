// Database de jogadores (OVR estimado, não é rating oficial). Formato: "Nome OVR".
const DB_RAW = {
  QB: "Josh Allen 99, Joe Burrow 98, Matthew Stafford 97, Patrick Mahomes 95, Caleb Williams 94, Lamar Jackson 93, Brock Purdy 92, Dak Prescott 91, Jordan Love 90, Trevor Lawrence 89, Drake Maye 88, Jared Goff 87, C.J. Stroud 85, Sam Darnold 84, Bryce Young 82, Bo Nix 81, Jayden Daniels 80, Tyler Shough 80, Aaron Rodgers 79, Jalen Hurts 79, Jaxson Dart 78, Kirk Cousins 78, Baker Mayfield 77, Deshaun Watson 77, Justin Herbert 77, Kyler Murray 76, Geno Smith 75, Mac Jones 75, Cam Ward 74, Michael Penix Jr 74, Fernando Mendoza 73, J.J. McCarthy 73, Marcus Mariota 73, Gardner Minshew II 72, Jacoby Brissett 72, Malik Willis 72, Jameis Winston 71, Joe Flacco 71, Ty Simpson 71, Andy Dalton 70, Drew Lock 70, Joe Milton 70, Justin Fields 70, Tua Tagovailoa 70",
  RB: "Jahmyr Gibbs 98, Bijan Robinson 97, Christian McCaffrey 97, Kenneth Walker 96, Derrick Henry 94, Jonathan Taylor 93, James Cook III 92, Kyren Williams 91, Bucky Irving 90, Saquon Barkley 89, D'Andre Swift 88, Jaylen Warren 87, Josh Jacobs 87, Breece Hall 86, Chuba Hubbard 86, De'Von Achane 85, Javonte Williams 85, Tony Pollard 85, Bhayshul Tuten 84, Chase Brown 84, Rhamondre Stevenson 84, Aaron Jones Sr 83, Cam Skattebo 83, Zach Charbonnet 83, Ashton Jeanty 82, Blake Corum 82, Jeremiyah Love 82, Travis Etienne Jr 82, Braelon Allen 81, Omarion Hampton 81, Quinshon Judkins 81, Rico Dowdle 81, Tyler Allgeier 81, David Montgomery 80, Jacory Croskey-Merritt 80, Jordan Mason 80, TreVeyon Henderson 80, Woody Marks 80, Alvin Kamara 79, J.K. Dobbins 79, Kenny Gainwell 79, Kyle Monangai 79, RJ Harvey 79, Brian Robinson Jr 78, James Conner 78, Justice Hill 78, Ollie Gordon II 78, Tyrone Tracy Jr 78, Emmett Johnson 77, Kimani Vidal 77, Rachaad White 77, Tank Bigsby 77, Tyjae Spears 77, Emanuel Wilson 76, Jadarian Price 76, Keaton Mitchell 76, Samaje Perine 76, Ty Johnson 76, Devin Singletary 75, Dylan Sampson 75",
  WR: "Ja'Marr Chase 99, Jaxon Smith-Njigba 99, Puka Nacua 98, Justin Jefferson 97, CeeDee Lamb 96, Amon-Ra St. Brown 95, Drake London 93, DeVonta Smith 92, Davante Adams 91, Mike Evans 91, Nico Collins 90, Zay Flowers 90, Chris Olave 89, Tee Higgins 89, George Pickens 88, Malik Nabers 88, Terry McLaurin 88, Christian Watson 87, Garrett Wilson 87, Tetairoa McMillan 87, A.J. Brown 86, Jameson Williams 86, Rashee Rice 86, Courtland Sutton 85, Jaylen Waddle 85, Parker Washington 85, Stefon Diggs 85, Alec Pierce 84, DJ Moore 84, Luther Burden III 84, Jordan Addison 83, Khalil Shakir 83, Matthew Golden 83, Michael Wilson 83, Rome Odunze 83, Cooper Kupp 82, DK Metcalf 82, Jakobi Meyers 82, Wan'Dale Robinson 82, Jauan Jennings 81, Josh Downs 81, Keenan Allen 81, Ladd McConkey 81, Michael Pittman 81, Chris Godwin Jr 80, Deebo Samuel Sr 80, Emeka Egbuka 80, Ricky Pearsall 80, Tank Dell 80, Brian Thomas Jr 79, Carnell Tate 79, DeMario Douglas 79, Jayden Reed 79, Jerry Jeudy 79, Romeo Doubs 79, Xavier Worthy 79, Calvin Ridley 78, Christian Kirk 78, Dontayvion Wicks 78, Jalen Coker 78",
  TE: "Trey McBride 99, George Kittle 97, Brock Bowers 96, Travis Kelce 93, Sam LaPorta 90, Dallas Goedert 89, Dalton Schultz 88, Tucker Kraft 87, Mark Andrews 86, Hunter Henry 85, Isaiah Likely 84, Dalton Kincaid 83, T.J. Hockenson 83, Colston Loveland 82, Harold Fannin Jr 82, Darren Waller 81, Tyler Warren 81, Juwan Johnson 80, Michael Mayer 80, Mike Gesicki 80, Brenton Strange 79, Kyle Pitts Sr 79, Pat Freiermuth 79, Cole Kmet 78, Darnell Washington 78, Evan Engram 78, David Njoku 77, Jake Ferguson 77, Theo Johnson 77, Dawson Knox 76, Kenyon Sadiq 76, Tyler Higbee 76, Zach Ertz 76, A.J. Barner 75, Cade Otton 75, Mason Taylor 75, Oronde Gadsden 75, Austin Hooper 74, Chigoziem Okonkwo 74, Noah Fant 74, Tommy Tremble 74, Colby Parkinson 73, Jonnu Smith 73, Josh Oliver 73, Noah Gray 73, Eli Stowers 72, Foster Moreau 72, Greg Dulcich 72, Gunnar Helm 72, Jake Tonges 72, Tyler Conklin 72, Adam Trautman 71, Chris Manhertz 71, Eli Raridon 71, Elijah Arroyo 71, Mo Alie-Cox 71, Nate Boerkircher 71, Brevyn Spann-Ford 70, Daniel Bellinger 70, Durham Smythe 70",
  OL: "Penei Sewell 98, Trent Williams 97, Creed Humphrey 96, Garett Bolles 96, Joe Thuney 96, Quinn Meinerz 96, Andrew Thomas 95, Quenton Nelson 95, Laremy Tunsil 94, Tristan Wirfs 94, Chris Lindstrom 94, Kolton Miller 93, Trey Smith 93, Darnell Wright 92, Rashawn Slater 91, Aaron Brewer 90, Christian Darrisaw 90, Jordan Mailata 90, Tyler Smith 90, Zach Frazier 89, Dion Dawkins 89, Kevin Dotson 89, Tyler Linderbaum 88, Brian O'Neill 88, Sam Cosmi 88, Erik McCoy 87, Jake Matthews 87, Paris Johnson Jr 87, Zach Bako-Bewele 87, Damien Lewis 87, Bernhard Raimann 86, Colton McKivitz 86, Joe Alt 86, Ronnie Stanley 86, Mike Onwenu 86, Ryan Neuzil 85, Alaric Jackson 85, Charles Cross 85, Spencer Brown 85, Dominick Puni 85, Tyler Booker 85, Hjalte Froholdt 84, Abraham Lucas 84, Luke Goedeke 84, Taylor Moton 84, Joe Tippmann 84, Jonah Jackson 84, Peter Skoronski 84, Tanor Bortolini 83, Armand Membou 83, Jermaine Eluemunor 83, Alijah Vera-Tucker 83, Steve Avila 83, Elgton Jenkins 82, Braden Smith 82, Mike McGlinchey 82, Morgan Moses 82, Will Campbell 82, Landon Dickerson 82, Amarius Mims 81",
  EDGE: "Myles Garrett 99, Micah Parsons 98, Maxx Crosby 97, T.J. Watt 96, Will Anderson Jr 95, Aidan Hutchinson 94, Greg Rousseau 93, Nick Bosa 92, Nik Bonitto 92, Chase Young 91, Danielle Hunter 90, Josh Hines-Allen 89, Brian Burns 88, Trey Hendrickson 88, Alex Highsmith 87, DeMarcus Lawrence 87, Khalil Mack 86, Andrew Van Ginkel 85, Byron Young 85, Josh Sweat 85, Abdul Carter 84, George Karlaftis 84, Jonathon Cooper 84, Dallas Turner 83, David Bailey 83, Jonathan Greenard 83, Lukas Van Ness 83, Boye Mafe 82, Jaelan Phillips 82, Jared Verse 82, Nolan Smith Jr 82, Harold Landry III 81, Jadeveon Clowney 81, Montez Sweat 81, Akheem Mesidor 80, Kyle Van Noy 80, Laiatu Latu 80, Odafe Oweh 80, Travon Walker 80, Cameron Jordan 79, Carl Granderson 79, Dorance Armstrong 79, Gabe Jacas 79, Jalon Walker 79, James Pearce Jr 79, Tuli Tuipulotu 79, Yaya Diaby 79, Bradley Chubb 78, Chop Robinson 78, Kayvon Thibodeaux 78, Keldric Faulk 78, Kwity Paye 78, Malachi Lawrence 78, Malcolm Koonce 78, Nick Herbig 78, Rueben Bain Jr 78, Will McDonald IV 78, Cashius Howell 77, Dani Dennis-Sutton 77, Derrick Moore 77",
  DT: "Jeffery Simmons 97, Derrick Brown 96, Cam Heyward 95, Aaron Donald 94, Quinnen Williams 94, Dexter Lawrence II 93, Vita Vea 92, Nnamdi Madubuike 91, Chris Jones 90, Zach Allen 90, DeForest Buckner 89, Leonard Williams 89, Alim McNeill 87, Jonathan Allen 87, Jalen Carter 86, Milton Williams 86, Byron Murphy II 85, Jalen Redmond 85, Kobie Turner 85, D.J. Reader 84, Daron Payne 84, Grover Stewart 83, Poona Ford 83, Zach Sieler 83, Ed Oliver 82, Gervon Dexter Sr 82, Mason Graham 82, Calais Campbell 81, Christian Barmore 81, Grady Jarrett 81, Jordan Davis 81, Javon Hargrave 80, John Franklin-Myers 80, Sheldon Rankins 80, Braden Fiske 79, DaQuan Jones 79, T'Vondre Sweat 79, Travis Jones 79, A'Shawn Robinson 78, Deone Walker 78, Derrick Harmon 78, Devonte Wyatt 78, Jarran Reed 78, Maliek Collins 78, Sebastian Joseph-Day 78, Tyleik Williams 78, Brandon Dorlus 77, Calijah Kancey 77, David Onyemata 77, Keeanu Benton 77, Kenny Clark 77, Moro Ojomo 77, Osa Odighizuwa 77, Shelby Harris 77, Teair Tart 77, Tommy Togiai 77, Walter Nolen III 77, Arik Armstead 76, B.J. Hill 76, Charles Omenihu 76",
  LB: "Fred Warner 98, Zack Baun 93, Roquan Smith 92, Blake Cashman 91, Drue Tranquill 90, Demario Davis 89, Jordyn Brooks 88, Alex Singleton 87, Devin Lloyd 87, Foyesade Oluokun 87, Arvell Reese 86, Devin Bush 86, Jack Campbell 86, Dre Greenlaw 85, Ernest Jones IV 85, Terrel Bernard 85, Carson Schwesinger 84, Nick Bolton 84, Quincy Williams 84, Azeez Al-Shaair 83, Kaden Elliss 83, Nate Landman 83, Robert Spillane 83, Bobby Okereke 82, Christian Elliss 82, Sonny Styles 82, T.J. Edwards 82, Tremaine Edmunds 82, Cedric Gray 81, Daiyan Henley 81, Jeremiah Owusu-Koramoah 81, Leo Chenal 81, Mack Wilson Sr 81, Alex Anzalone 80, Divine Deablo 80, Edgerrin Cooper 80, Frankie Luvu 80, Nakobe Dean 80, Patrick Queen 80, Quay Walker 80, Jacob Rodriguez 79, Jamien Sherwood 79, Jihaad Campbell 79, Payton Wilson 79, Trenton Simpson 79, Cody Barton 78, Eric Wilson 78, Isaiah McDuffie 78, Omar Speights 78, Zaire Franklin 78, Denzel Perryman 77, Drake Thomas 77, Josiah Trotter 77, Tyrel Dodson 77, Anthony Hill Jr. 76, Dorian Williams 76, Ivan Pace Jr 76, Micah McFadden 76, Akeem Davis-Gaither 75, Cole Holcomb 75",
  CB: "Pat Surtain II 97, Trent McDuffie 96, Denzel Ward 95, Devon Witherspoon 94, Christian Gonzalez 93, Derek Stingley Jr 92, Quinyon Mitchell 90, Byron Murphy Jr 89, A.J. Terrell Jr 88, Jamel Dean 88, Sauce Gardner 88, Isaiah Rodgers 87, Jaycee Horn 87, Joey Porter Jr 87, Charvarius Ward Sr 86, Jaylon Johnson 86, Travis Hunter 86, Carlton Davis III 85, Jalen Pitre 85, Kamari Lassiter 85, Marlon Humphrey 85, Cooper DeJean 84, DJ Turner II 84, Mansoor Delane 84, Nate Wiggins 84, Chidobe Awuzie 83, Taron Johnson 83, Zyon McCollum 83, Deommodore Lenoir 82, Deonte Banks 82, Donte Jackson 82, Jourdan Lewis 82, Kyler Gordon 82, Cobie Durant 81, D.J. Reed 81, Jacob Parrish 81, Jaylen Watson 81, Mike Jackson 81, Nohl Williams 81, Tarheeb Still 81, Amik Robertson 80, Cam Taylor-Britt 80, Christian Benford 80, Cor'Dale Flott 80, Greg Newsome II 80, Marcus Jones 80, Riq Woolen 80, Tyson Campbell 80, Dru Phillips 79, Ja'Quan McMillian 79, Keisean Nixon 79, L'Jarius Sneed 79, Riley Moss 79, Dax Hill 78, Eric Stokes 78, Martin Emerson Jr 78, Renardo Green 78, Trey Amos 78, Alontae Taylor 77, Benjamin St-Juste 77"
};
const TM = {"Pat Surtain II": "DEN", "Trent McDuffie": "LAR", "Denzel Ward": "CLE", "Devon Witherspoon": "SEA", "Christian Gonzalez": "NE", "Derek Stingley Jr": "HOU", "Quinyon Mitchell": "PHI", "Byron Murphy Jr": "MIN", "A.J. Terrell Jr": "ATL", "Jamel Dean": "PIT", "Sauce Gardner": "IND", "Isaiah Rodgers": "MIN", "Jaycee Horn": "CAR", "Joey Porter Jr": "DAL", "Charvarius Ward Sr": "IND", "Jaylon Johnson": "CHI", "Travis Hunter": "JAX", "Carlton Davis III": "NE", "Jalen Pitre": "HOU", "Kamari Lassiter": "HOU", "Marlon Humphrey": "BAL", "Cooper DeJean": "PHI", "DJ Turner II": "CIN", "Mansoor Delane": "KC", "Nate Wiggins": "BAL", "Chidobe Awuzie": "BAL", "Taron Johnson": "LV", "Zyon McCollum": "TB", "Deommodore Lenoir": "SF", "Deonte Banks": "NYG", "Donte Jackson": "LAC", "Jourdan Lewis": "JAX", "Kyler Gordon": "CHI", "Cobie Durant": "DAL", "D.J. Reed": "DET", "Jacob Parrish": "TB", "Jaylen Watson": "LAR", "Mike Jackson": "CAR", "Nohl Williams": "KC", "Tarheeb Still": "LAC", "Amik Robertson": "WAS", "Cam Taylor-Britt": "IND", "Christian Benford": "BUF", "Cor'Dale Flott": "TEN", "Greg Newsome II": "NYG", "Marcus Jones": "NE", "Riq Woolen": "PHI", "Tyson Campbell": "CLE", "Dru Phillips": "NYG", "Ja'Quan McMillian": "DEN", "Keisean Nixon": "GB", "L'Jarius Sneed": "KC", "Riley Moss": "DEN", "Dax Hill": "CIN", "Eric Stokes": "LV", "Martin Emerson Jr": "NO", "Renardo Green": "SF", "Trey Amos": "WAS", "Alontae Taylor": "TEN", "Benjamin St-Juste": "GB", "Jeffery Simmons": "CHI", "Derrick Brown": "CAR", "Cam Heyward": "PIT", "Aaron Donald": "LAR", "Quinnen Williams": "DAL", "Dexter Lawrence II": "CIN", "Vita Vea": "TB", "Nnamdi Madubuike": "BAL", "Chris Jones": "KC", "Zach Allen": "DEN", "DeForest Buckner": "SF", "Leonard Williams": "SEA", "Alim McNeill": "DET", "Jonathan Allen": "CIN", "Jalen Carter": "PHI", "Milton Williams": "NE", "Byron Murphy II": "SEA", "Jalen Redmond": "MIN", "Kobie Turner": "LAR", "D.J. Reader": "NYG", "Daron Payne": "WAS", "Grover Stewart": "IND", "Poona Ford": "LAR", "Zach Sieler": "MIA", "Ed Oliver": "BUF", "Gervon Dexter Sr": "ATL", "Mason Graham": "CLE", "Calais Campbell": "BAL", "Christian Barmore": "NE", "Grady Jarrett": "CHI", "Jordan Davis": "JAX", "Javon Hargrave": "GB", "John Franklin-Myers": "TEN", "Sheldon Rankins": "HOU", "Braden Fiske": "LAR", "DaQuan Jones": "NE", "T'Vondre Sweat": "NYJ", "Travis Jones": "BAL", "A'Shawn Robinson": "TB", "Deone Walker": "BUF", "Derrick Harmon": "PIT", "Devonte Wyatt": "GB", "Jarran Reed": "SEA", "Maliek Collins": "CLE", "Sebastian Joseph-Day": "PIT", "Tyleik Williams": "DET", "Brandon Dorlus": "ATL", "Calijah Kancey": "TB", "David Onyemata": "NYJ", "Keeanu Benton": "PIT", "Kenny Clark": "DAL", "Moro Ojomo": "PHI", "Osa Odighizuwa": "SF", "Shelby Harris": "NYG", "Teair Tart": "LAC", "Tommy Togiai": "HOU", "Walter Nolen III": "ARI", "Arik Armstead": "JAX", "B.J. Hill": "CIN", "Charles Omenihu": "WAS", "Myles Garrett": "LAR", "Micah Parsons": "GB", "Maxx Crosby": "LV", "T.J. Watt": "PIT", "Will Anderson Jr": "HOU", "Aidan Hutchinson": "DET", "Greg Rousseau": "BUF", "Nick Bosa": "SF", "Nik Bonitto": "DEN", "Chase Young": "NO", "Danielle Hunter": "HOU", "Josh Hines-Allen": "JAX", "Brian Burns": "NYG", "Trey Hendrickson": "BAL", "Alex Highsmith": "PIT", "DeMarcus Lawrence": "SEA", "Khalil Mack": "LAC", "Andrew Van Ginkel": "MIN", "Byron Young": "LAR", "Josh Sweat": "ARI", "Abdul Carter": "NYG", "George Karlaftis": "KC", "Jonathon Cooper": "DEN", "Dallas Turner": "MIN", "David Bailey": "NYJ", "Jonathan Greenard": "PHI", "Lukas Van Ness": "GB", "Boye Mafe": "CIN", "Jaelan Phillips": "CAR", "Jared Verse": "CLE", "Nolan Smith Jr": "PHI", "Harold Landry III": "NE", "Jadeveon Clowney": "HOU", "Montez Sweat": "CHI", "Akheem Mesidor": "LAC", "Kyle Van Noy": "MIN", "Laiatu Latu": "IND", "Odafe Oweh": "WAS", "Travon Walker": "JAX", "Cameron Jordan": "NO", "Carl Granderson": "NO", "Dorance Armstrong": "WAS", "Gabe Jacas": "NE", "Jalon Walker": "ATL", "James Pearce Jr": "ATL", "Tuli Tuipulotu": "LAC", "Yaya Diaby": "TB", "Bradley Chubb": "BUF", "Chop Robinson": "MIA", "Kayvon Thibodeaux": "NYG", "Keldric Faulk": "TEN", "Kwity Paye": "LV", "Malachi Lawrence": "DAL", "Malcolm Koonce": "LV", "Nick Herbig": "PIT", "Rueben Bain Jr": "TB", "Will McDonald IV": "NYJ", "Cashius Howell": "CIN", "Dani Dennis-Sutton": "GB", "Derrick Moore": "DET", "Fred Warner": "SF", "Zack Baun": "PHI", "Roquan Smith": "BAL", "Blake Cashman": "MIN", "Drue Tranquill": "KC", "Demario Davis": "NYJ", "Jordyn Brooks": "MIA", "Alex Singleton": "DEN", "Devin Lloyd": "CAR", "Foyesade Oluokun": "JAX", "Arvell Reese": "NYG", "Devin Bush": "CHI", "Jack Campbell": "DET", "Dre Greenlaw": "SF", "Ernest Jones IV": "SEA", "Terrel Bernard": "BUF", "Carson Schwesinger": "CLE", "Nick Bolton": "KC", "Quincy Williams": "CLE", "Azeez Al-Shaair": "HOU", "Kaden Elliss": "NO", "Nate Landman": "LAR", "Robert Spillane": "NE", "Bobby Okereke": "CAR", "Christian Elliss": "NE", "Sonny Styles": "WAS", "T.J. Edwards": "CHI", "Tremaine Edmunds": "NYG", "Cedric Gray": "TEN", "Daiyan Henley": "LAC", "Jeremiah Owusu-Koramoah": "CLE", "Leo Chenal": "WAS", "Mack Wilson Sr": "ARI", "Alex Anzalone": "TB", "Divine Deablo": "ATL", "Edgerrin Cooper": "GB", "Frankie Luvu": "WAS", "Nakobe Dean": "LV", "Patrick Queen": "PIT", "Quay Walker": "LV", "Jacob Rodriguez": "MIA", "Jamien Sherwood": "NYJ", "Jihaad Campbell": "PHI", "Payton Wilson": "PIT", "Trenton Simpson": "BAL", "Cody Barton": "TEN", "Eric Wilson": "MIN", "Isaiah McDuffie": "GB", "Omar Speights": "LAR", "Zaire Franklin": "GB", "Denzel Perryman": "LAC", "Drake Thomas": "SEA", "Josiah Trotter": "TB", "Tyrel Dodson": "CAR", "Anthony Hill Jr.": "TEN", "Dorian Williams": "BUF", "Ivan Pace Jr": "MIN", "Micah McFadden": "NYG", "Akeem Davis-Gaither": "IND", "Cole Holcomb": "PIT", "Penei Sewell": "DET", "Trent Williams": "SF", "Creed Humphrey": "KC", "Garett Bolles": "DEN", "Joe Thuney": "CHI", "Quinn Meinerz": "DEN", "Andrew Thomas": "NYG", "Quenton Nelson": "SEA", "Chris Lindstrom": "ATL", "Laremy Tunsil": "WAS", "Tristan Wirfs": "TB", "Kolton Miller": "LV", "Trey Smith": "KC", "Darnell Wright": "CHI", "Rashawn Slater": "LAC", "Aaron Brewer": "MIA", "Christian Darrisaw": "MIN", "Jordan Mailata": "PHI", "Tyler Smith": "DAL", "Dion Dawkins": "BUF", "Kevin Dotson": "LAR", "Zach Frazier": "PIT", "Brian O'Neill": "MIN", "Sam Cosmi": "WAS", "Tyler Linderbaum": "LV", "Damien Lewis": "CAR", "Erik McCoy": "NO", "Jake Matthews": "ATL", "Paris Johnson Jr": "ARI", "Zach Bako-Bewele": "GB", "Bernhard Raimann": "IND", "Colton McKivitz": "SF", "Joe Alt": "LAC", "Mike Onwenu": "NE", "Ronnie Stanley": "BAL", "Alaric Jackson": "LAR", "Charles Cross": "SEA", "Dominick Puni": "SF", "Ryan Neuzil": "BAL", "Spencer Brown": "BUF", "Tyler Booker": "DAL", "Abraham Lucas": "SEA", "Hjalte Froholdt": "ARI", "Joe Tippmann": "NYJ", "Jonah Jackson": "CHI", "Luke Goedeke": "TB", "Peter Skoronski": "TEN", "Taylor Moton": "CAR", "Alijah Vera-Tucker": "NE", "Armand Membou": "NYJ", "Jermaine Eluemunor": "NYG", "Steve Avila": "LAR", "Tanor Bortolini": "IND", "Braden Smith": "HOU", "Elgton Jenkins": "CLE", "Landon Dickerson": "PHI", "Mike McGlinchey": "DEN", "Morgan Moses": "NE", "Will Campbell": "NE", "Amarius Mims": "CIN", "Jahmyr Gibbs": "DET", "Bijan Robinson": "ATL", "Christian McCaffrey": "SF", "Kenneth Walker": "KC", "Derrick Henry": "BAL", "Jonathan Taylor": "IND", "James Cook III": "BUF", "Kyren Williams": "LAR", "Bucky Irving": "TB", "Saquon Barkley": "PHI", "D'Andre Swift": "CHI", "Jaylen Warren": "PIT", "Josh Jacobs": "GB", "Breece Hall": "NYJ", "Chuba Hubbard": "CAR", "De'Von Achane": "MIA", "Javonte Williams": "DAL", "Tony Pollard": "TEN", "Bhayshul Tuten": "JAX", "Chase Brown": "CIN", "Rhamondre Stevenson": "NE", "Aaron Jones Sr": "MIN", "Cam Skattebo": "NYG", "Zach Charbonnet": "SEA", "Ashton Jeanty": "LV", "Blake Corum": "LAR", "Jeremiyah Love": "ARI", "Travis Etienne Jr": "NO", "Braelon Allen": "NYJ", "Omarion Hampton": "LAC", "Quinshon Judkins": "CLE", "Rico Dowdle": "PIT", "Tyler Allgeier": "ARI", "David Montgomery": "HOU", "Jacory Croskey-Merritt": "WAS", "Jordan Mason": "MIN", "TreVeyon Henderson": "NE", "Woody Marks": "HOU", "Alvin Kamara": "NO", "J.K. Dobbins": "DEN", "Kenny Gainwell": "TB", "Kyle Monangai": "CHI", "RJ Harvey": "DEN", "Brian Robinson Jr": "ATL", "James Conner": "ARI", "Justice Hill": "BAL", "Ollie Gordon II": "MIA", "Tyrone Tracy Jr": "NYG", "Emmett Johnson": "KC", "Kimani Vidal": "LAC", "Rachaad White": "WAS", "Tank Bigsby": "PHI", "Tyjae Spears": "TEN", "Emanuel Wilson": "SEA", "Jadarian Price": "SEA", "Keaton Mitchell": "LAC", "Samaje Perine": "CIN", "Ty Johnson": "BUF", "Devin Singletary": "NYG", "Dylan Sampson": "CLE", "Josh Allen": "BUF", "Joe Burrow": "CIN", "Matthew Stafford": "LAR", "Patrick Mahomes": "KC", "Caleb Williams": "CHI", "Lamar Jackson": "BAL", "Brock Purdy": "SF", "Dak Prescott": "DAL", "Jordan Love": "GB", "Trevor Lawrence": "JAX", "Drake Maye": "NE", "Jared Goff": "DET", "C.J. Stroud": "HOU", "Sam Darnold": "SEA", "Bryce Young": "CAR", "Bo Nix": "DEN", "Jayden Daniels": "WAS", "Tyler Shough": "NO", "Aaron Rodgers": "PIT", "Jalen Hurts": "PHI", "Jaxson Dart": "NYG", "Kirk Cousins": "MIN", "Baker Mayfield": "TB", "Deshaun Watson": "CLE", "Justin Herbert": "LAC", "Kyler Murray": "MIN", "Geno Smith": "NYJ", "Mac Jones": "SF", "Cam Ward": "TEN", "Michael Penix Jr": "ATL", "Fernando Mendoza": "LV", "J.J. McCarthy": "NYG", "Marcus Mariota": "WAS", "Gardner Minshew II": "ARI", "Jacoby Brissett": "BAL", "Malik Willis": "MIA", "Jameis Winston": "NYG", "Joe Flacco": "CIN", "Ty Simpson": "LAR", "Andy Dalton": "ATL", "Drew Lock": "SEA", "Joe Milton": "PHI", "Justin Fields": "KC", "Tua Tagovailoa": "ATL", "Trey McBride": "ARI", "George Kittle": "SF", "Brock Bowers": "LV", "Travis Kelce": "KC", "Sam LaPorta": "DET", "Dallas Goedert": "PHI", "Dalton Schultz": "HOU", "Tucker Kraft": "GB", "Mark Andrews": "BAL", "Hunter Henry": "NE", "Isaiah Likely": "NYG", "Dalton Kincaid": "BUF", "T.J. Hockenson": "MIN", "Colston Loveland": "CHI", "Harold Fannin Jr": "CLE", "Darren Waller": "CAR", "Tyler Warren": "IND", "Juwan Johnson": "NO", "Michael Mayer": "LV", "Mike Gesicki": "CIN", "Brenton Strange": "JAX", "Kyle Pitts Sr": "ATL", "Pat Freiermuth": "PIT", "Cole Kmet": "CHI", "Darnell Washington": "PIT", "Evan Engram": "DEN", "David Njoku": "LAC", "Jake Ferguson": "DAL", "Theo Johnson": "NYG", "Dawson Knox": "BUF", "Kenyon Sadiq": "NYJ", "Tyler Higbee": "LAR", "Zach Ertz": "PHI", "A.J. Barner": "SEA", "Cade Otton": "TB", "Mason Taylor": "NYJ", "Oronde Gadsden": "LAC", "Austin Hooper": "ATL", "Chigoziem Okonkwo": "WAS", "Noah Fant": "NO", "Tommy Tremble": "CAR", "Colby Parkinson": "LAR", "Jonnu Smith": "GB", "Josh Oliver": "MIN", "Noah Gray": "KC", "Eli Stowers": "PHI", "Foster Moreau": "HOU", "Greg Dulcich": "MIA", "Gunnar Helm": "TEN", "Jake Tonges": "SF", "Tyler Conklin": "DET", "Adam Trautman": "DEN", "Chris Manhertz": "NYG", "Eli Raridon": "NE", "Elijah Arroyo": "SEA", "Mo Alie-Cox": "IND", "Nate Boerkircher": "JAX", "Brevyn Spann-Ford": "DAL", "Daniel Bellinger": "TEN", "Durham Smythe": "BAL", "Ja'Marr Chase": "CIN", "Jaxon Smith-Njigba": "SEA", "Puka Nacua": "LAR", "Justin Jefferson": "MIN", "CeeDee Lamb": "DAL", "Amon-Ra St. Brown": "DET", "Drake London": "ATL", "DeVonta Smith": "PHI", "Davante Adams": "LAR", "Mike Evans": "SF", "Nico Collins": "HOU", "Zay Flowers": "BAL", "Chris Olave": "NO", "Tee Higgins": "CIN", "George Pickens": "DAL", "Malik Nabers": "NYG", "Terry McLaurin": "WAS", "Christian Watson": "GB", "Garrett Wilson": "NYJ", "Tetairoa McMillan": "CAR", "A.J. Brown": "NE", "Jameson Williams": "DET", "Rashee Rice": "KC", "Courtland Sutton": "DEN", "Jaylen Waddle": "DEN", "Parker Washington": "JAX", "Stefon Diggs": "WAS", "Alec Pierce": "IND", "DJ Moore": "BUF", "Luther Burden III": "CHI", "Jordan Addison": "MIN", "Khalil Shakir": "BUF", "Matthew Golden": "GB", "Michael Wilson": "ARI", "Rome Odunze": "CHI", "Cooper Kupp": "SEA", "DK Metcalf": "PIT", "Jakobi Meyers": "JAX", "Wan'Dale Robinson": "TEN", "Jauan Jennings": "MIN", "Josh Downs": "KC", "Keenan Allen": "SF", "Ladd McConkey": "LAC", "Michael Pittman": "PIT", "Chris Godwin Jr": "TB", "Deebo Samuel Sr": "SF", "Emeka Egbuka": "TB", "Ricky Pearsall": "SF", "Tank Dell": "HOU", "Brian Thomas Jr": "JAX", "Carnell Tate": "TEN", "DeMario Douglas": "NE", "Jayden Reed": "GB", "Jerry Jeudy": "CLE", "Romeo Doubs": "NE", "Xavier Worthy": "KC", "Calvin Ridley": "TEN", "Christian Kirk": "SF", "Dontayvion Wicks": "PHI", "Jalen Coker": "CAR"};
const DB = [];
for (const pos in DB_RAW) for (const s of DB_RAW[pos].split(', ')) {
  const i = s.lastIndexOf(' ');
  DB.push({ name: s.slice(0, i), pos, ovr: +s.slice(i + 1), tm: TM[s.slice(0, i)] || 'KC' });
}

// Motor do jogo: leilão, duelos e simulação de partidas.
const SLOTS = { QB: 1, RB: 1, WR: 2, TE: 1, OL: 3, EDGE: 2, DT: 2, LB: 2, CB: 2 };
const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'OL', 'EDGE', 'DT', 'LB', 'CB'];
const OFF_POS = ['QB', 'RB', 'WR', 'TE', 'OL'];
const TOTAL_SLOTS = 16, BUDGET = 200;
const LOT_MS = 6000, BID_MS = 4000;   // tempo do lote; cada lance leva o relógio pra BID_MS
let RNG = Math.random;                         // gerador trocável: com semente, todos os clientes sorteiam a mesma temporada
const R = () => RNG();
function mulberry32(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function withSeed(seed, fn) { if (seed == null) return fn(); const old = RNG; RNG = mulberry32(seed >>> 0); try { return fn(); } finally { RNG = old; } }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const expo = () => -Math.log(1 - R());
const rint = (a, b) => Math.floor(a + R() * (b - a + 1));
const duel = (a, b, k) => 1 / (1 + Math.exp(-(a - b) / (k || 8)));
const avg = (...x) => x.reduce((s, v) => s + v, 0) / x.length;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const shortName = n => { const t = n.replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, '').split(' '); return t[t.length - 1]; };

// ---------- escalação e OVR de ataque / defesa ----------
function lineup(roster) {
  const by = p => roster.filter(x => x.pos === p).sort((a, b) => b.ovr - a.ovr);
  return { QB: by('QB')[0], RB: by('RB')[0], WR: by('WR'), TE: by('TE')[0], OL: by('OL'),
           EDGE: by('EDGE'), DT: by('DT'), LB: by('LB'), CB: by('CB') };
}
// Peso de cada posição no OVR do time. A base é 1,0x; a média é sempre dividida pela soma dos pesos, então a escala do OVR não muda.
const WEIGHT = { QB: 2.5, RB: 1.0, WR: 1.5, TE: 1.0, OL: 1.0, EDGE: 2.0, DT: 1.0, LB: 1.5, CB: 1.5 };   // base 1,0x; degraus 1,5x e 2,0x; o QB vale 2,5x
// Posições no campo (x, y em "casas"): o desenho da tela e as sinergias usam as MESMAS coordenadas.
// [posição, índice (0 = melhor OVR da posição), x, y]
const SPOT = {
  off: [['OL', 0, 1.5, 0], ['OL', 1, 2.5, 0], ['OL', 2, 3.5, 0], ['TE', 0, 4.5, 0], ['WR', 0, 1, 1], ['QB', 0, 2.5, 1], ['WR', 1, 4, 1], ['RB', 0, 2.5, 2]],
  def: [['CB', 0, 1, 0], ['CB', 1, 4, 0], ['LB', 0, 2, 1], ['LB', 1, 3, 1], ['EDGE', 0, 1, 2], ['DT', 0, 2, 2], ['DT', 1, 3, 2], ['EDGE', 1, 4, 2]]
};
const SYN_DIST = 1.6;   // só jogadores vizinhos no campo se conectam
// Titulares de cada lado, com o peso e o lugar da posição.
function sideStarters(L, side) {
  return SPOT[side].map(([pos, i, x, y]) => ({ pos, i, x, y, p: Array.isArray(L[pos]) ? L[pos][i] : L[pos], w: WEIGHT[pos] }));
}
// SINERGIA: dois titulares do MESMO lado, do mesmo time da NFL e VIZINHOS no campo formam um link.
// Cada link soma SYN pontos de OVR por peso das duas posições (QB+WR = +1,0; RB+QB ≈ +0,9; OL+OL = +0,5), com teto por lado.
const SYN = 0.25, SYN_CAP = 4;
function synLinks(L, side) {
  const xs = sideStarters(L, side).filter(x => x.p && x.p.tm), out = [];
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++)
    if (xs[i].p.tm === xs[j].p.tm && Math.hypot(xs[i].x - xs[j].x, xs[i].y - xs[j].y) <= SYN_DIST)
      out.push({ a: xs[i].p, b: xs[j].p, pa: xs[i].pos, pb: xs[j].pos, tm: xs[i].p.tm, pts: SYN * (xs[i].w + xs[j].w) });
  return out;
}
const synPts = links => Math.min(SYN_CAP, links.reduce((n, l) => n + l.pts, 0));
// OVR do ataque / da defesa = média PONDERADA dos 8 titulares do lado + bônus de sinergia.
function ratings(L) {
  const wavg = side => { const xs = sideStarters(L, side); return xs.reduce((n, x) => n + x.p.ovr * x.w, 0) / xs.reduce((n, x) => n + x.w, 0); };
  const off = wavg('off') + synPts(synLinks(L, 'off'));
  const def = wavg('def') + synPts(synLinks(L, 'def'));
  return { off, def, all: (off + def) / 2 };
}

// ---------- partida: 6 posses por time ----------
// 1ª rolagem: ataque vence = touchdown.
// 2ª rolagem: ataque vence = tenta o field goal (pode errar); defesa vence = a posse acaba sem pontos
//   (punt, interceptação, fumble, quarta descida perdida ou sack; a defesa forte rouba mais a bola).
// Bola roubada (interceptação, fumble, quarta perdida) dá campo curto: a posse seguinte do rival ganha bônus de OVR.
const POSSESSIONS = 6;
const SIM = { k1: 12, k2: 12, base1: 0.355, base2: 0.43, make: 0.85, td: 7, fg: 3, short: 6,
  start: 25, shortYd: 3, gain: 20, slope: 0.55, sd: 13, first: 10, fgRange: 52, ref: 84, lvl: 0.3, clean: 60, to: 0.034, downs: 0.30, sack: 0.20, maxSeries: 7 };
const logit = p => Math.log(p / (1 - p));
const pRoll = (off, def, k, base) => 1 / (1 + Math.exp(-((off - def) / k + logit(base))));
const pTD = (off, def) => pRoll(off, def, SIM.k1, SIM.base1);
const pFG = (off, def) => pRoll(off, def, SIM.k2, SIM.base2);
const TAKE = { INT: SIM.short, FUM: SIM.short, DOWNS: SIM.short / 2 };      // bônus da posse seguinte do rival
// Posse = DRIVE de campo. A bola começa na linha 25 (ou mais à frente se foi roubada: campo curto).
// Cada série tenta avançar 10 jardas: o ganho médio cresce com (ataque do time − defesa do rival).
// Chegou na linha 100 = touchdown. Série que falha: dentro do alcance (linha 60+) vem o field goal (que pode errar);
// fora dele, quarta descida arriscada, sack ou punt. A cada série, ataque fraco contra defesa forte também perde a bola.
// Ou seja: pontuar, não pontuar e roubar a bola dependem do ataque de um lado E da defesa do outro.
function simPossession(offT, defT, opts) {
  const short = (opts && opts.short) || 0, off = offT.rt.off, def = defT.rt.def, edge = off - def;
  const lvl = ((offT.rt.all + defT.rt.all) / 2 - SIM.ref);                // nível dos DOIS times: jogo entre times fortes é mais limpo e pontuado; entre fracos, truncado
  const tf = Math.max(.6, Math.min(1.6, 1 + (def - off) / 40));            // >1 quando a defesa manda
  const mean = SIM.gain + SIM.slope * edge + SIM.lvl * lvl, tOdds = SIM.to * tf * Math.max(.5, 1 - lvl / SIM.clean);
  let y = SIM.start + short * SIM.shortYd, y0 = y, series = 0;
  const end = (result, extra) => ({ result, pts: result === 'TD' ? SIM.td : result === 'FG' ? SIM.fg : 0, off, def, short, y0, yd: Math.min(100, Math.round(y)), series, ...extra });
  while (series < SIM.maxSeries) {
    series++;
    if (R() < tOdds) return end(R() < .55 ? 'INT' : 'FUM');
    const g = mean + SIM.sd * (R() + R() + R() - 1.5) * 2;
    if (g >= SIM.first) { y += g; if (y >= 100) return end('TD'); continue; }
    if (y >= SIM.fgRange) return end(R() < SIM.make ? 'FG' : 'MISS');
    if (y >= 45 && R() < SIM.downs) return end('DOWNS');
    return end(R() < SIM.sack * tf * Math.max(.6, 1 - lvl / SIM.clean) ? 'SACK' : 'PUNT');
  }
  return y >= SIM.fgRange ? end(R() < SIM.make ? 'FG' : 'MISS') : end('PUNT');
}
// distribuição real de um confronto (ataque × defesa), por amostragem — usada no laboratório
function driveOdds(off, def, n, offT, defT) {
  n = n || 4000; const c = { TD: 0, FG: 0, MISS: 0, PUNT: 0, INT: 0, FUM: 0, DOWNS: 0, SACK: 0 };
  const A = offT || { rt: { off, all: off } }, D = defT || { rt: { def, all: def } };
  for (let i = 0; i < n; i++) c[simPossession(A, D).result]++;
  for (const k in c) c[k] /= n; c.none = 1 - c.TD - c.FG; c.pts = c.TD * SIM.td + c.FG * SIM.fg; return c;
}
function simGame(tA, tB, opts) {
  opts = opts || {};
  const T2 = [tA, tB], sc = [0, 0], poss = [], carry = [0, 0];
  const play = (n, ot) => { for (let i = 0; i < 2; i++) { const r = simPossession(T2[i], T2[1 - i], { short: carry[i] }); carry[i] = 0; carry[1 - i] = TAKE[r.result] || 0; sc[i] += r.pts; poss.push({ n, team: i, ot, ...r, scoreAfter: sc.slice() }); } };
  for (let n = 1; n <= POSSESSIONS; n++) play(n, false);
  let ot = false;
  for (let r = 1; r <= 3 && sc[0] === sc[1]; r++) { ot = true; play(POSSESSIONS + r, true); }
  if (sc[0] === sc[1] && opts.noTie) sc[R() < pRoll(tA.rt.all, tB.rt.all, 6, .5) ? 0 : 1] += SIM.fg;
  return { a: tA.id, b: tB.id, sa: sc[0], sb: sc[1], ot, poss };
}

// ---------- leilão ----------
const POSW = { QB: 1.6, RB: 1.0, WR: 1.15, TE: 1.0, OL: 1.05, EDGE: 1.3, DT: 1.0, LB: 1.0, CB: 1.15 };
const need = (t, pos) => SLOTS[pos] - t.roster.filter(p => p.pos === pos).length;
const slotsLeft = t => TOTAL_SLOTS - t.roster.length;
const maxBid = (t, p) => need(t, p.pos) <= 0 ? 0 : Math.max(0, t.budget - (slotsLeft(t) - 1));

function maxTeams(db) {
  const c = {}; db.forEach(p => c[p.pos] = (c[p.pos] || 0) + 1);
  return Math.min(...POS_ORDER.map(pos => Math.floor((c[pos] || 0) / SLOTS[pos])));
}
function makePool(db, n, extra) {
  extra = extra == null ? .5 : extra;           // sobra de jogadores por posição (50% a mais, mínimo +2)
  const pool = [];
  for (const pos of POS_ORDER) {
    const all = db.filter(p => p.pos === pos), need = SLOTS[pos] * n;
    const take = Math.min(all.length, need + Math.max(2, Math.ceil(need * extra)));
    pool.push(...shuffle(all).slice(0, take));
  }
  return shuffle(pool).map((p, i) => ({ ...p, id: i, passes: 0, sold: false }));
}
function newBot(id, name) {
  const pos = {}; POS_ORDER.forEach(p => pos[p] = .8 + R() * .45);
  return { id, name, human: false, budget: BUDGET, roster: [], persona: { aggr: .85 + R() * .35, pos } };
}

class Auction {
  constructor(teams, db, extra) {
    this.teams = teams; this.pool = makePool(db, teams.length, extra); this.i = -1; this.log = []; this.done = false; this.now = 0;
    this.total = teams.length * TOTAL_SLOTS; this.soldCount = 0; this.version = 0;
    this.stats = {};
    for (const pos of POS_ORDER) {
      const xs = this.pool.filter(p => p.pos === pos).map(p => p.ovr), m = avg(...xs);
      this.stats[pos] = { m, sd: Math.max(2, Math.sqrt(avg(...xs.map(x => (x - m) ** 2)))) };
    }
    this.next();
  }
  get cur() { return this.pool[this.i]; }
  // online: humano que caiu vira bot (e volta a ser humano quando reconecta) sem travar o lote
  setHuman(team, on) {
    team.human = on;
    if (this.phase !== 'bidding' || !this.elig || !this.elig.includes(team)) return;
    if (!on) { this.passed.delete(team); this.lim[team.id] = this.limit(team, this.cur); this.botAt[team.id] = this.now + rint(600, 2000); }
    this.humanIn = this.elig.some(t => t.human && !this.passed.has(t));
    if (!this.humanIn) this.timeLeft = Math.min(this.timeLeft, 2000);
  }
  get human() { return this.teams.find(t => t.human); }
  supply(pos) { return this.pool.reduce((n, p) => n + (p.pos === pos && !p.sold ? 1 : 0), 0); }   // jogadores ainda no pool
  demand(pos) { return this.teams.reduce((n, t) => n + Math.max(0, need(t, pos)), 0); }            // vagas ainda abertas
  limit(t, p) {
    const s = this.stats[p.pos], z = (p.ovr - s.m) / s.sd, q = clamp(1 + .6 * z, .3, 2.8);
    // sobrou jogador na posição? bot sem pressa deixa os fracos passarem (até 2 vezes)
    if (this.supply(p.pos) > this.demand(p.pos) && p.passes < 2 && z < -.3 && R() < clamp((-z - .2) * .7, 0, .9)) return 0;
    const urg = 1 + .6 * (1 - slotsLeft(t) / TOTAL_SLOTS);
    const syn = 1 + .07 * Math.min(3, t.roster.filter(x => x.tm && x.tm === p.tm && (OFF_POS.includes(x.pos) === OFF_POS.includes(p.pos))).length);   // bot paga um pouco mais por quem liga com o elenco
    let w = (t.budget / slotsLeft(t)) * q * POSW[p.pos] * t.persona.aggr * t.persona.pos[p.pos] * urg * syn * (.85 + R() * .3);
    if (slotsLeft(t) === 1) w = Math.max(w, t.budget * .7);
    return clamp(Math.round(w), 1, maxBid(t, p));
  }
  next() {
    if (this.soldCount >= this.total) { this.done = true; this.phase = 'done'; return; }
    const n = this.pool.length; let found = -1;
    for (let k = 1; k <= n; k++) { const j = (this.i + k + n) % n, q = this.pool[j]; if (!q.sold && !q.deferred && this.demand(q.pos) > 0) { found = j; break; } }
    if (found < 0) { this.autoFill(); this.done = true; this.phase = 'done'; return; }
    this.i = found;
    const p = this.cur;
    this.price = 0; this.leader = null; this.sold = null; this.phase = 'bidding'; this.passed = new Set(); this.bids = []; this.nBids = 0;
    this.elig = this.teams.filter(t => maxBid(t, p) >= 1);
    this.humanIn = this.elig.some(t => t.human);
    this.timeLeft = this.timeMax = this.humanIn ? LOT_MS : 2000;
    this.lim = {}; this.botAt = {};
    for (const t of this.elig) if (!t.human) {
      this.lim[t.id] = this.limit(t, p);
      // alguns bots esperam a reta final pra dar o lance
      const sniper = this.humanIn && R() < .35;
      this.botAt[t.id] = this.now + (sniper ? rint(LOT_MS - 3500, LOT_MS - 500) : rint(600, 2400) * (this.humanIn ? 1 : .4));
    }
    // vaga obrigatória: não sobra jogador nessa posição e só um time precisa
    if (this.elig.length === 1 && !this.elig[0].human && this.supply(p.pos) <= this.demand(p.pos)) { this.leader = this.elig[0]; this.price = 1; this.sell('única vaga'); }
    else this.settle();
  }
  // quem ainda pode disputar: humano que não saiu desse lance e tem saldo, e qualquer bot com saldo.
  // O teto de um bot é segredo: ele nunca "sai" sozinho, só o relógio encerra o lote (senão o lance humano fecharia o lote na hora e entregaria o teto dos bots).
  active(t) {
    if (t === this.leader || maxBid(t, this.cur) <= this.price) return false;
    return t.human ? !this.passed.has(t) : true;
  }
  // todos os outros times saíram de verdade (humanos que passaram ou sem saldo): com líder, o lote é dele na hora; sem líder, o jogador sai da vez
  // Só encerra antes do relógio quando alguém saiu de verdade (passou) e não sobrou ninguém na disputa. Fora isso, o lote só acaba quando o tempo acaba.
  settle() {
    if (this.phase !== 'bidding' || !this.passed.size) return;
    if (!this.elig.some(t => this.active(t))) this.sell();
  }
  bid(team, amount) {
    if (this.phase !== 'bidding' || !this.elig.includes(team) || team === this.leader || this.passed.has(team)) return false;
    if (amount <= this.price || amount > maxBid(team, this.cur)) return false;
    this.bids.push({ team, kind: 'bid', price: amount, inc: amount - this.price, first: this.price === 0 }); this.nBids++; if (this.bids.length > 12) this.bids.shift();
    this.price = amount; this.leader = team;
    // lote dura 6s; cada lance leva o relógio pra 4s (dinâmico: quem dá lance recomeça a contagem)
    if (this.humanIn) { this.timeLeft = BID_MS; this.timeMax = BID_MS; }
    else { if (this.timeLeft <= 1300) this.timeLeft = 1300; this.timeMax = Math.max(this.timeMax, this.timeLeft); }
    this.settle();
    return true;
  }
  pass(team) {                                   // "passar" vale só pra quem clicou; o relógio só acelera quando nenhum humano resta na disputa
    if (this.phase !== 'bidding' || !team.human || !this.elig.includes(team) || this.leader === team || this.passed.has(team)) return false;
    this.passed.add(team); (this.cur.pb = this.cur.pb || new Set()).add(team.id);
    this.bids.push({ team, kind: 'pass', price: this.price }); this.nBids++; if (this.bids.length > 12) this.bids.shift();
    this.humanIn = this.elig.some(t => t.human && !this.passed.has(t));
    if (!this.humanIn) { this.timeLeft = Math.min(this.timeLeft, 1500); this.timeMax = 1500; }
    this.settle();
    return true;
  }
  sell(note) {
    const p = this.cur; let w = this.leader, price = this.price;
    if (!w) {
      // todo time que ainda precisa dessa posição é humano e recusou esse jogador: ele fica pro sorteio do fim (o jogo completa o time)
      const needers = this.teams.filter(t => need(t, p.pos) > 0);
      if (!this.elig.length || (needers.length && needers.every(t => t.human && p.pb && p.pb.has(t.id)))) {
        p.deferred = true;
        this.sold = { player: p, team: null, price: 0, note: 'fica pro sorteio' }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
        this.phase = 'sold'; this.pause = this.humanIn ? 800 : 300; this.version++; return;
      }
      if (this.supply(p.pos) > this.demand(p.pos)) {      // sobra jogador: ninguém quis, volta pro fim da fila
        p.passes++;
        this.sold = { player: p, team: null, price: 0, note: 'ninguém quis' }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
        this.phase = 'sold'; this.pause = this.humanIn ? 800 : 300; this.version++; return;
      }
      const cand = this.elig.filter(t => !(t.human && this.passed.has(t)));       // quem passou não é sorteado nessa hora
      if (!cand.length) {
        p.deferred = true;
        this.sold = { player: p, team: null, price: 0, note: 'fica pro sorteio' }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
        this.phase = 'sold'; this.pause = this.humanIn ? 800 : 300; this.version++; return;
      }
      w = cand[rint(0, cand.length - 1)]; price = 1; note = 'sem lances';
    }
    w.budget -= price; w.roster.push({ name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id: p.id, paid: price });
    p.sold = true; this.soldCount++;
    this.sold = { player: p, team: w, price, note }; this.log.unshift(this.sold); this.log.length = Math.min(this.log.length, 40);
    this.phase = 'sold'; this.pause = this.humanIn ? 2600 : 450; this.version++;
  }
  // fim do leilão: quem ainda tem vaga aberta recebe, por sorteio, jogadores que sobraram nas posições que faltam (US$ 1 cada)
  autoFill() {
    for (const t of shuffle(this.teams.filter(x => slotsLeft(x) > 0))) for (const pos of POS_ORDER) {
      while (need(t, pos) > 0) {
        const c = this.pool.filter(p => p.pos === pos && !p.sold); if (!c.length) break;
        const p = c[rint(0, c.length - 1)], price = Math.min(1, t.budget);
        t.budget -= price; t.roster.push({ name: p.name, pos: p.pos, ovr: p.ovr, tm: p.tm, id: p.id, paid: price });
        p.sold = true; this.soldCount++; (t.auto = t.auto || []).push(p);
        this.log.unshift({ player: p, team: t, price, note: 'sorteio no fim' }); this.log.length = Math.min(this.log.length, 40);
      }
    }
    this.version++;
  }
  tick(dt) {
    this.now += dt;
    if (this.phase === 'done') return;
    if (this.phase === 'sold') { this.pause -= dt; if (this.pause <= 0) this.next(); return; }
    for (const t of this.elig) {
      if (t.human || t === this.leader || this.now < this.botAt[t.id]) continue;
      const lim = Math.min(this.lim[t.id], maxBid(t, this.cur));
      if (lim > this.price) {
        const P = this.price, W = P < 6 ? [[1, .75], [2, .25]] : P < 20 ? [[1, .5], [2, .2], [5, .3]] : [[1, .4], [2, .2], [5, .3], [10, .1]];
        const ok = W.filter(w => lim >= P + w[0]); let x = R() * ok.reduce((n, w) => n + w[1], 0), inc = 1;     // com orçamento maior, os lances grandes sobem de 1 em 1, de 2, de 5 ou de 10
        for (const w of ok) { if ((x -= w[1]) < 0) { inc = w[0]; break; } }
        this.bid(t, this.price + inc);
      }
      this.botAt[t.id] = this.now + rint(500, 1700) * (this.humanIn ? 1 : .35);
    }
    if (this.phase !== 'bidding') return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this.sell();
  }
}

// ---------- conferências ----------
const MIN_TEAMS = 4, MAX_CONF = 8;
const nextPow2 = n => { let s = 1; while (s < n) s *= 2; return s; };
// quantos classificam por conferência: 2→1, 3→2, 4→2, 5→3, 6→3, 7→4, 8→4 (o melhor fica de bye quando a chave não fecha em potência de 2)
const qualifiers = n => n <= 1 ? n : Math.ceil(n / 2);
const pieceLen = n => n <= 2 ? 6 : n === 3 ? 4 : n === 4 ? 3 : 2;
// nome da conferência = pedaço do nome de cada time (3 times: LazaPedrJonh; 6+ times: LaPeJoBuMiNe…)
function confName(names) {
  const len = pieceLen(names.length);
  return names.map(nm => {
    const ws = String(nm).normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).map(w => w.replace(/[^A-Za-z]/g, '')).filter(Boolean);
    const w = ws.length ? ws[ws.length - 1] : 'Time';
    return w.charAt(0).toUpperCase() + w.slice(1, len).toLowerCase();
  }).join('');
}
function drawConferences(teams) {
  if (teams.length > MAX_CONF * 2) throw new Error('máximo de ' + MAX_CONF * 2 + ' times');
  const sh = shuffle(teams), k = Math.ceil(sh.length / 2);
  const confs = [sh.slice(0, k), sh.slice(k)].map(g => { g.sort((a, b) => a.id - b.id); return { ids: g.map(t => t.id), name: confName(g.map(t => t.name)) }; });
  if (confs[0].name === confs[1].name) confs[1].name += '²';
  return confs;
}

// ---------- temporada ----------
function finishTeam(t) { t.lineup = lineup(t.roster); t.rt = ratings(t.lineup); return t; }
const rankRow = (x, y) => (y.w + y.t / 2) - (x.w + x.t / 2) || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf;
// classificação de cada conferência a partir de uma lista de jogos já disputados
function buildTables(confs, games) {
  const st = {}; confs.forEach((c, i) => c.ids.forEach(id => st[id] = { id, conf: i, w: 0, l: 0, t: 0, pf: 0, pa: 0 }));
  for (const g of games) {
    if (g.stage !== 'Temporada') continue;
    const A = st[g.a], B = st[g.b]; A.pf += g.sa; A.pa += g.sb; B.pf += g.sb; B.pa += g.sa;
    if (g.sa > g.sb) { A.w++; B.l++; } else if (g.sb > g.sa) { B.w++; A.l++; } else { A.t++; B.t++; }
  }
  return confs.map(c => c.ids.map(id => st[id]).sort(rankRow));
}
// distribui os jogos em rodadas: ninguém joga duas vezes na mesma rodada e as rodadas ficam com tamanho parecido
function makeRounds(sched, teams) {
  const deg = {}; teams.forEach(t => deg[t.id] = 0); sched.forEach(g => { deg[g[0].id]++; deg[g[1].id]++; });
  const D = Math.max(...Object.values(deg));
  for (let R = D; R <= sched.length; R++) {
    for (let k = 0; k < 300; k++) {
      const rounds = Array.from({ length: R }, () => ({ used: new Set(), games: [] })); let ok = true;
      for (const g of shuffle(sched)) {
        const free = rounds.filter(r => !r.used.has(g[0].id) && !r.used.has(g[1].id));
        if (!free.length) { ok = false; break; }
        const m = Math.min(...free.map(r => r.games.length)), pick = shuffle(free.filter(r => r.games.length === m))[0];
        pick.used.add(g[0].id); pick.used.add(g[1].id); pick.games.push(g);
      }
      if (ok) return rounds.map(r => r.games);
    }
  }
  return [sched];
}
const STAGE_RANK = { 'Temporada': 0, 'Semifinal da Conferência': 1, 'Final da Conferência': 2, 'Super Bowl': 3 };
function simSeason(teams, confs) {
  confs = confs || drawConferences(teams);
  const confOf = {}; confs.forEach((c, i) => c.ids.forEach(id => confOf[id] = i));
  const by = id => teams.find(t => t.id === id);
  const st = {}; teams.forEach(t => st[t.id] = { id: t.id, conf: confOf[t.id], w: 0, l: 0, t: 0, pf: 0, pa: 0 });
  const games = [];
  const rec = g => {
    const A = st[g.a], B = st[g.b]; A.pf += g.sa; A.pa += g.sb; B.pf += g.sb; B.pa += g.sa;
    if (g.sa > g.sb) { A.w++; B.l++; } else if (g.sb > g.sa) { B.w++; A.l++; } else { A.t++; B.t++; }
  };
  // calendário: 2 jogos contra cada time da própria conferência, 1 contra cada time da outra
  const sched = [];
  for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++) {
    const a = teams[i], b = teams[j];
    if (confOf[a.id] === confOf[b.id]) { sched.push([a, b, true]); sched.push([b, a, true]); }
    else sched.push(R() < .5 ? [a, b, false] : [b, a, false]);
  }
  const rounds = [];
  const reg = makeRounds(sched, teams);
  reg.forEach((rg, ri) => {
    const gs = rg.map(([a, b, inConf]) => { const g = simGame(a, b); g.stage = 'Temporada'; g.inConf = inConf; g.conf = inConf ? confOf[a.id] : -1; g.round = ri; games.push(g); rec(g); return g; });
    const playing = new Set(); gs.forEach(g => { playing.add(g.a); playing.add(g.b); });
    rounds.push({ kind: 'reg', label: `Rodada ${ri + 1} de ${reg.length}`, games: gs, bye: teams.filter(t => !playing.has(t.id)) });
  });
  const rank = rankRow;
  const table = Object.values(st).sort(rank);
  // mata-mata de cada conferência
  const po = [];
  const play = (a, b, stage, conf) => { const g = simGame(a, b, { noTie: true }); g.stage = stage; g.conf = conf; po.push(g); return g.sa > g.sb ? a : b; };
  const champs = confs.map((c, ci) => {
    c.table = c.ids.map(id => st[id]).sort(rank);
    c.seeds = c.table.map(r => by(r.id));
    c.q = qualifiers(c.ids.length);
    c.byes = nextPow2(c.q) - c.q;
    let alive = c.seeds.slice(0, c.q);
    while (alive.length > 1) {
      const S = nextPow2(alive.length), nb = S - alive.length, bye = alive.slice(0, nb), pl = alive.slice(nb), win = [];
      const stage = S >= 4 ? 'Semifinal da Conferência' : 'Final da Conferência';
      for (let i = 0; i < pl.length / 2; i++) win.push(play(pl[i], pl[pl.length - 1 - i], stage, ci));
      alive = bye.concat(win).sort((x, y) => c.seeds.indexOf(x) - c.seeds.indexOf(y));
    }
    c.champion = alive[0];
    return alive[0];
  });
  // Super Bowl: campeão de uma conferência contra o da outra
  const [x, y] = R() < .5 ? champs : champs.slice().reverse();
  const champion = champs.length > 1 ? play(x, y, 'Super Bowl', -1) : champs[0];
  po.sort((p, q) => STAGE_RANK[p.stage] - STAGE_RANK[q.stage]);
  const PL = { 'Semifinal da Conferência': 'Semifinais das conferências', 'Final da Conferência': 'Finais das conferências', 'Super Bowl': 'Super Bowl' };
  for (const stg of Object.keys(PL)) {
    const gs = po.filter(g => g.stage === stg); if (!gs.length) continue;
    gs.forEach(g => g.round = rounds.length);
    rounds.push({ kind: 'po', label: PL[stg], games: gs, bye: stg === 'Semifinal da Conferência' ? confs.flatMap(c => c.seeds.slice(0, c.byes)) : [] });
  }
  games.push(...po);
  return { confs, table, games, rounds, champion, finalists: champs.length > 1 ? [x, y] : [champs[0]] };
}


export { DB, SLOTS, POS_ORDER, OFF_POS, TOTAL_SLOTS, BUDGET, Auction, newBot, maxTeams, finishTeam, withSeed, rint, R, maxBid, need, slotsLeft, MIN_TEAMS };
