"""Audio + graphic decisions. Every row includes two independently necessary constraints.
The compiler checks that exactly one table row satisfies both; this is not a score calibration.
"""
GRAPHICS=[]
def g(kind,title,intro,need,reason,columns,rows,rules,vi):
 GRAPHICS.append(dict(kind=kind,title=title,intro=intro,need=need,reason=reason,columns=columns,rows=rows,rules=rules,vi=vi))

ALTERNATIVES=r'''
Tracing samples after delivery~Repairing the regular laboratory van~Negotiating a long-term storage agreement|The laboratory is moving to a new address.~The samples have already been tested.~The clinic must return the containers tomorrow.
Redesigning a training presentation~Replacing the venue's lift~Reducing workshop registration fees|The workshop is being filmed for television.~The presenter requested a larger stage.~The building will be closed for renovation.
Disputing a completed courier charge~Changing a customer's delivery address~Canceling an earlier collection|The package has already left the building.~The client requested free packaging.~The collection point has no parking spaces.
Changing the venue's catering order~Canceling a rail reservation~Advertising a new station shuttle|The briefing location has no meeting room.~The return ticket has expired.~The client requested a different presenter.
Buying a replacement laptop~Changing a room reservation~Editing the speaker's presentation|The speaker has canceled the demonstration.~The venue has no electrical supply.~The image file needs to be translated.
Moving a reception desk~Shortening a job interview~Replacing a video-conferencing account|The candidate requested an in-person meeting.~The interviewer must leave after twenty minutes.~The booths are being painted that afternoon.
Selling used exhibition panels~Renegotiating a client's order quantity~Reserving warehouse shelves|The client has already loaded the vehicle.~The panels must be dismantled into pieces.~The return has no collection deadline.
Writing a new sales brochure~Extending afternoon service hours~Recruiting additional trainers|The team has no customer complaints.~The manager wants a full-week residential course.~The service desk will be closed all day.
Changing a maintenance contract~Replacing the entire air-conditioning system~Measuring a new workshop|The site receives disposable filters every day.~The filter is being used only for a one-day display.~The supplier requires a wider opening.
Changing a flight's baggage allowance~Canceling a group hotel reservation~Reserving an airport lounge|The flight leaves the airport at five.~The group has already checked into the hotel.~The shuttle journey must take exactly forty minutes.
Publishing project records online~Upgrading a personal phone plan~Closing an overseas office|The team has no storage requirements.~Every file must be deleted today.~The cheapest plan has already been approved.
Renewing every employee's certificate~Changing a delivery's weight~Booking an operator-training course|The delivery is scheduled for the morning.~The task requires no certification.~The qualification can be renewed after the lift.
Choosing a new exhibition title~Ordering a heavier display frame~Renegotiating a printing deadline|The sponsor requires glossy nonrecycled paper.~The display will be installed on a concrete floor.~All samples have identical weights.
Organizing a private committee meeting~Repairing a venue's kitchen~Choosing a food supplier|The event will serve only packaged cold drinks.~The fundraiser has fewer than thirty guests.~The guests will prepare meals at home.
Replacing an entire scanner~Changing the purchasing budget~Disposing of an old charger|A higher voltage is always approved.~The scanner will use the battery for display only.~Capacity is irrelevant to operation.
Canceling an evening presentation~Collecting a completed repair~Buying a new display unit|The display is needed only next month.~The staff member can arrive at any time.~The shop is closed throughout the afternoon.
Booking an adult-only lecture~Changing a coach's departure~Arranging an overnight family stay|The coach is staying until midnight.~All children are older than twelve.~The guide requires a late finish.
Increasing all travel allowances~Removing the need for taxi receipts~Advertising airport transport|The allowance is always paid at its maximum.~The trip did not involve an airport.~Public transport is irrelevant to taxi eligibility.
Training new permanent employees~Extending afternoon access permits~Rescheduling contractor deliveries|Employee-only sessions satisfy every audience.~The induction may finish after work begins.~The contractor permit is for the morning.
Canceling a traveling exhibition~Selling unused hall equipment~Announcing daytime-only access|Only one afternoon is needed for the whole project.~The installation is already complete.~Evening entry is prohibited for every booking.
Reducing the field team's memory requirement~Replacing desktop monitors~Repairing a heavy laptop|All work takes place at a fixed desk.~Only the screen color matters.~The team is not permitted to travel.
Announcing a completed equipment repair~Changing weekday opening hours~Canceling every support contract|The equipment is switched off every weekend.~Any response time is acceptable.~The service is needed only on weekdays.
Funding attendance-only conferences~Raising the course-fee cap~Refunding every employee purchase|The budget has no fee limit.~Assessment is explicitly excluded.~All events use the same funding category.
Selling renovated display panels~Renting an outdoor event space~Disposing of water-resistant equipment|The panels can remain outdoors without protection.~Only five square meters are needed.~The storage is for vehicles rather than panels.
Changing the laboratory's sample type~Extending the receiving desk's hours~Canceling every morning delivery|Drivers can leave supplies before staff arrive.~Only part of a window must fit.~The morning run begins after noon.
Recruiting an untrained tour group~Changing a garden's entry prices~Renewing every guide's contract|The tour needs no first-aid coverage.~Availability begins after the tour starts.~The roster guarantees every qualification is current.
'''

g('c','Choosing a refrigerated courier','The clinic samples must reach the laboratory this morning. The regular van has broken down, and the laboratory stops accepting this batch at ten. We cannot simply book the cheapest service.',
'We need arrival no later than ten and a refrigerated vehicle.','The samples must remain within their specified temperature range.',
['Service','Arrival','Refrigerated'],[['Arrow','09:30','No'],['Beacon','09:45','Yes'],['Cedar','10:15','Yes'],['Delta','10:30','No']],[(1,'<=','10:00'),(2,'=','Yes')],
"Cần đến chậm nhất10h và có xe lạnh; Beacon thỏa cả hai, Arrow đúng giờ nhưng không lạnh.")
g('c','Booking an accessible training room','Our afternoon workshop now has eighteen participants, including someone who needs step-free access. The smallest room is cheaper, but we must check both capacity and access before confirming anything.',
'The room must seat at least eighteen and have step-free access.','Adding chairs does not remove a staircase.',
['Room','Seats','Step-free'],[['Birch','16','Yes'],['Cove','20','No'],['Fern','24','Yes'],['Grove','12','No']],[(1,'>=','18'),(2,'=','Yes')],
"Fern đủ24chỗ và tiếp cận không bậc; Cove đủ chỗ nhưng không phù hợp tiếp cận, Birch chỉ16chỗ.")
g('c','Selecting an evening collection service','The document package will not be ready until four thirty. It must leave today, and our department cannot authorize a collection charge above twenty dollars without another approval. Please compare the options rather than choosing the first open slot.',
'We need collection at or after four thirty for no more than twenty dollars.','The extra approval cannot be obtained before the office closes.',
['Service','Collection','Charge'],[['Swift','16:00','$12'],['Relay','16:45','$18'],['Direct','17:00','$26'],['Local','15:30','$10']],[(1,'>=','16:30'),(2,'<=','$20')],
"Relay lấy16:45giá18đô, đúng hai điều kiện; Swift quá sớm, Direct vượt ngân sách20đô.")
g('c','Finding a suitable client train','The client briefing begins at nine twenty. I want to reach the venue before then, but the local train stops far from its entrance. Walking from the station should take no more than ten minutes because I am carrying display materials.',
'Choose a train arriving by nine ten with a walk of ten minutes or less.','The display materials make a longer walk impractical.',
['Train','Arrival','Walk minutes'],[['L7','09:00','18'],['E4','09:05','8'],['E8','09:25','6'],['L9','09:30','15']],[(1,'<=','09:10'),(2,'<=','10')],
"E4 đến9:05, đi bộ8phút thì đến địa điểm9:13 trước buổi họp9:20; L7 cần đi bộ quá10phút, E8 đến muộn.")
g('c','Choosing a compatible projector','The visiting speaker brings a laptop with only a USB-C output. We have twenty minutes between room bookings, so a projector requiring a lengthy installation is not suitable even if its image is brighter.',
'It must accept USB-C directly and take no more than fifteen minutes to set up.','There is no time to install extra conversion equipment.',
['Projector','USB-C direct','Setup minutes'],[['Pico','No','5'],['Vista','Yes','12'],['Summit','Yes','25'],['Orbit','No','18']],[(1,'=','Yes'),(2,'<=','15')],
"Vista nhận USB-Ctrực tiếp và lắp12phút; Summit cần25phút, Pico thiếu cổng dù lắp nhanh.")
g('c','Reserving a quiet interview booth','The candidate is joining remotely from another country, and our interviewer needs somewhere quiet for a forty-minute call. The open meeting pods would pick up too much noise from the reception area.',
'We need a sound-insulated booth available for at least forty minutes.','The interview cannot be shortened to fit a smaller slot.',
['Booth','Insulated','Free minutes'],[['Aster','Yes','30'],['Bramble','No','60'],['Clover','Yes','45'],['Dahlia','No','50']],[(1,'=','Yes'),(2,'>=','40')],
"Clover cách âm và trống45phút; Aster chỉ30phút, Bramble đủ lâu nhưng không cách âm.")
g('c','Planning a return freight pickup','The returned display panels weigh eighty kilograms in total. The driver must have a tail lift because our receiving site has no loading dock. Splitting the panels would require another collection that the client has not approved.',
'The vehicle needs a tail lift and capacity of at least eighty kilograms.','The site cannot raise the load onto a vehicle itself.',
['Vehicle','Capacity kg','Tail lift'],[['R1','100','No'],['R2','60','Yes'],['R3','120','Yes'],['R4','70','No']],[(1,'>=','80'),(2,'=','Yes')],
"R3đủ tải120kgvà có bàn nâng; R1không có nâng, R2có nâng nhưng chỉ60kg.")
g('c','Choosing a short staff course','The customer-service team has only one free morning next week. We need a course that covers complaint handling rather than sales techniques, and nobody can be away for more than three hours.',
'Select complaint handling with a duration no longer than three hours.','The afternoon service desk still has to be staffed.',
['Course','Topic','Hours'],[['Connect','Sales','2'],['Resolve','Complaints','3'],['Deep Dive','Complaints','5'],['Present','Speaking','2']],[(1,'=','Complaints'),(2,'<=','3')],
"Resolve đúng chủ đề xử lý khiếu nại và3giờ; Deep Dive cùng chủ đề nhưng dài5giờ.")
g('c','Ordering a replacement filter','The maintenance label specifies a filter width of forty centimeters. We also need the washable type, because the site cannot receive disposable replacements regularly. A similar-looking filter is not enough.',
'Choose a forty-centimeter filter that is washable.','The remote site needs to clean and reuse the filter.',
['Filter','Width cm','Washable'],[['F20','40','No'],['F21','35','Yes'],['F22','40','Yes'],['F23','45','No']],[(1,'=','40'),(2,'=','Yes')],
"F22rộng40cmvà rửa được; F20đúng cỡ nhưng không rửa được, F21sai kích thước.")
g('c','Selecting a hotel shuttle','Our flight lands at five, and the baggage collection estimate is forty minutes. We need a hotel shuttle leaving no earlier than five forty, but the hotel requires arrival before seven for the group check-in.',
'Departure must be at or after five forty and hotel arrival before seven.','The group check-in desk closes at seven.',
['Shuttle','Leaves airport','Hotel arrival'],[['S1','17:20','18:00'],['S2','17:50','18:35'],['S3','18:30','19:10'],['S4','19:00','19:35']],[(1,'>=','17:40'),(2,'<','19:00')],
"S2rời17:50sau lúc dự kiến lấy hành lý và đến18:35trước19h; S1quá sớm, S3quá muộn.")
g('c','Choosing a document storage plan','The archive team estimates that the current project needs six hundred gigabytes. The contract requires storage within our region, so we cannot choose a cheaper overseas plan just because it has more capacity.',
'We need at least six hundred gigabytes in the local region.','The contract restricts where the project records may be stored.',
['Plan','Capacity GB','Region'],[['Basic','500','Local'],['Global','1000','Overseas'],['Regional','750','Local'],['Travel','800','Overseas']],[(1,'>=','600'),(2,'=','Local')],
"Regional đủ750GBvà nội vùng; Global nhiều dung lượng nhưng ngoài vùng, Basic thiếu dung lượng.")
g('c','Assigning a certified operator','The afternoon lifting job needs an operator whose certification is still current through September. We also need someone available after two, because the delivery cannot arrive earlier. Please check both columns before calling anyone.',
'Certification must extend through September and availability must begin by two.','The lift cannot be operated with an expired qualification.',
['Operator','Valid through month','Available from'],[['Ari','8','13:00'],['Bea','11','14:00'],['Cole','12','15:30'],['Dina','7','12:00']],[(1,'>=','9'),(2,'<=','14:00')],
"Bea có chứng nhận đến tháng11và rảnh từ14h; Cole rảnh quá muộn, Ari hết hạn tháng8.")
g('c','Selecting an exhibition print stock','The sponsor requires recycled paper, but the hanging display cannot take sheets heavier than two hundred grams per square meter. The sample that feels most substantial is therefore not necessarily usable for this installation.',
'The stock must be recycled and no heavier than two hundred grams per square meter.','The hanging system has a material-weight limit.',
['Stock','Recycled','Weight gsm'],[['Cloud','Yes','250'],['Leaf','Yes','180'],['Gloss','No','160'],['Board','No','300']],[(1,'=','Yes'),(2,'<=','200')],
"Leaf là giấy tái chế180gsm; Cloud tái chế nhưng quá nặng, Gloss nhẹ nhưng không tái chế.")
g('c','Choosing a community event venue','The community fundraiser expects seventy people and needs a kitchen for serving hot food. We can use a smaller hall for committee meetings, but not for this event. The booking must cover both the guests and the catering requirements.',
'The venue must hold at least seventy people and include a kitchen.','Hot food will be prepared and served at the event.',
['Venue','Capacity','Kitchen'],[['Canal','80','No'],['Meadow','60','Yes'],['Orchard','90','Yes'],['Studio','45','No']],[(1,'>=','70'),(2,'=','Yes')],
"Orchard chứa90người và có bếp; Canal đủ chỗ nhưng không có bếp, Meadow chỉ60chỗ.")
g('c','Selecting a replacement battery','The scanner requires a twelve-volt battery with at least four amp-hours of capacity. The purchasing catalog lists several physically similar models, but using a higher voltage would not be an acceptable way to gain capacity.',
'We need exactly twelve volts and at least four amp-hours.','The scanner voltage requirement cannot be exceeded.',
['Battery','Volts','Amp-hours'],[['B11','12','3'],['B12','18','5'],['B13','12','5'],['B14','9','6']],[(1,'=','12'),(2,'>=','4')],
"B13đúng12Vvà5Ah; B12vượt điện áp, B11đúng điện áp nhưng chỉ3Ah.")
g('c','Choosing a same-day repair appointment','The only available staff member can bring the display unit after eleven. We need it returned before the evening presentation at six, so an appointment time alone isn\'t enough; check the promised collection time as well.',
'Drop-off must be at or after eleven, with collection before six.','The repaired unit is needed for an evening presentation.',
['Slot','Drop-off','Collection'],[['Early','09:30','15:00'],['Midday','11:30','17:00'],['Late','14:00','18:30'],['Express','10:30','16:00']],[(1,'>=','11:00'),(2,'<','18:00')],
"Midday nhận11:30và trả17h; Early/Express nhận quá sớm, Late trả sau hạn.")
g('c','Finding a child-friendly tour','The family group includes children aged eight. They want a guided activity finishing by four so they can catch their return coach. We should not recommend a tour merely because it starts early enough.',
'The minimum age must be eight or below, and the tour must end by four.','The return coach leaves soon after the activities finish.',
['Tour','Minimum age','Ends'],[['Cliff','12','15:00'],['Garden','6','15:45'],['Cave','8','16:30'],['Tower','10','14:30']],[(1,'<=','8'),(2,'<=','16:00')],
"Garden nhận từ6tuổi và xong15:45; Cave phù hợp tuổi nhưng kết thúc sau16h.")

g('t','Choosing a reimbursement category','This briefing concerns claims for home-to-airport travel. A taxi is reimbursable only when public transport is unavailable at the required departure time. The expense table shows the allowable daily maximum, not an automatic payment. Keep the receipt and claim the actual eligible cost.',
'For an eligible taxi claim, use the category marked airport transfer with a maximum of at least forty dollars.','The actual fare for this journey was forty dollars.',
['Code','Category','Maximum'],[['T1','Local bus','$15'],['T2','Airport transfer','$35'],['T3','Airport transfer','$50'],['T4','Hotel meal','$60']],[(1,'=','Airport transfer'),(2,'>=','$40')],
"T3đúng nhóm ra sân bay và trần50đô đủ cho phí thực40; mức trần không phải số tự động được nhận.")
g('t','Selecting a safety induction','New contractors must complete the induction for external personnel before entering the work area. The afternoon access permit starts at two, so choose a session that finishes before then. Attendance at an employee-only session does not satisfy the contractor requirement.',
'Choose a contractor session ending before two.','The work-area permit begins at two oclock.',
['Session','Audience','Ends'],[['I1','Employees','11:00'],['I2','Contractors','13:30'],['I3','Contractors','14:30'],['I4','Visitors','12:00']],[(1,'=','Contractors'),(2,'<','14:00')],
"I2đúng đối tượng nhà thầu và xong13:30trước quyền vào14h; I1sớm nhưng sai đối tượng.")
g('t','Identifying a suitable exhibition date','The traveling exhibition requires a hall with evening access because the first group arrives after normal office hours. The organizer also needs a full week of availability. Shorter bookings cannot accommodate the installation and dismantling days shown in the project plan.',
'Select an evening-access booking lasting at least seven days.','Installation and dismantling are included in the required week.',
['Booking','Evening access','Days'],[['W1','Yes','5'],['W2','No','10'],['W3','Yes','8'],['W4','No','7']],[(1,'=','Yes'),(2,'>=','7')],
"W3có quyền vào buổi tối và8ngày; W1chỉ5ngày, W2không vào tối dù thời lượng đủ.")
g('t','Selecting a replacement staff laptop','The project laptop order is restricted to models with at least sixteen gigabytes of memory and a weight below one and a half kilograms. These requirements support the field team, which carries the computer between sites. The lowest price alone should not determine the order.',
'Choose memory of at least sixteen gigabytes and weight below one point five kilograms.','The field team needs to carry the computer between sites.',
['Model','Memory GB','Weight kg'],[['M1','8','1.2'],['M2','16','1.8'],['M3','32','1.4'],['M4','8','1.1']],[(1,'>=','16'),(2,'<','1.5')],
"M3có32GBvà1,4kg; M2đủ RAM nhưng quá nặng, M1/M4nhẹ nhưng thiếu RAM.")
g('t','Choosing a technical support plan','The new service contract needs weekend cover because our equipment runs seven days a week. Management also requires a response within four hours. A plan offering only a weekday response does not meet the requirement, even if its response time is shorter.',
'Choose weekend coverage with a response time no longer than four hours.','The equipment remains in operation throughout the week.',
['Plan','Weekend cover','Response hours'],[['Care A','No','2'],['Care B','Yes','8'],['Care C','Yes','4'],['Care D','No','1']],[(1,'=','Yes'),(2,'<=','4')],
"Care Ccó cuối tuần và phản hồi4giờ; Care Bmất8giờ, A/Dnhanh nhưng không có cuối tuần.")
g('t','Identifying an eligible training expense','The professional-development budget covers approved courses with an assessment component. For this funding round, the fee must not exceed three hundred dollars. Attendance-only events may still be useful, but they are paid from a different budget and should not be submitted under this category.',
'Select an assessed course costing no more than three hundred dollars.','This particular budget requires evidence of assessment.',
['Course','Assessment','Fee'],[['Basics','No','$180'],['Applied','Yes','$280'],['Advanced','Yes','$420'],['Forum','No','$90']],[(1,'=','Yes'),(2,'<=','$300')],
"Applied có đánh giá và phí280đô dưới trần300; Advanced vượt trần, các buổi không đánh giá thuộc quỹ khác.")
g('t','Choosing a temporary storage unit','The renovation contractor needs indoor storage for water-sensitive display panels. The panels require eighteen square meters of usable floor area. The table already excludes space reserved for access aisles, so compare the listed usable areas rather than adding the aisle space again.',
'Choose indoor storage with at least eighteen square meters of usable area.','The panels must be protected from weather.',
['Unit','Indoor','Area sqm'],[['U1','Yes','15'],['U2','No','30'],['U3','Yes','22'],['U4','No','20']],[(1,'=','Yes'),(2,'>=','18')],
"U3trong nhà và22m²; U1thiếu diện tích, U2/U4rộng nhưng ngoài trời.")
g('t','Selecting a morning delivery window','The receiving team cannot accept deliveries before eight thirty because the access desk is unstaffed. Our laboratory supplies must be checked in before ten so they can be used in the morning run. Please select a delivery window whose entire span fits between those times, not one that merely overlaps them.',
'The window must start at or after eight thirty and end before ten.','A staffed desk is required for acceptance and checking.',
['Window','Starts','Ends'],[['D1','08:00','09:00'],['D2','08:45','09:30'],['D3','09:30','10:30'],['D4','10:00','11:00']],[(1,'>=','08:30'),(2,'<','10:00')],
"D2toàn bộ8:45–9:30nằm trong giới hạn; D1bắt đầu quá sớm, D3kết thúc quá muộn.")
g('t','Finding a qualified replacement guide','For the botanical garden\'s Saturday tour, the replacement guide must hold the current first-aid endorsement and be available by ten. General guiding experience alone is not sufficient for this route. The roster lists the start of each person\'s availability, not the time their previous tour finishes.',
'Choose a guide with current first aid who is available by ten.','The route requires the endorsement stated in the tour plan.',
['Guide','First aid current','Available'],[['Eli','No','09:00'],['Faye','Yes','10:30'],['Gia','Yes','09:45'],['Hugo','No','08:30']],[(1,'=','Yes'),(2,'<=','10:00')],
"Gia có chứng nhận sơ cứu hiện hành và rảnh9:45; Faye quá muộn, Eli/Hugo thiếu chứng nhận.")
