"""Original workplace situations. Each record is a different decision, not a renamed item.
Correct options are stored first; the compiler independently permutes answer positions.
These are AI-authored practice drafts, not ETS items or human-approved material.
"""
CONVERSATIONS=[]
TALKS=[]
def c(title,dialogue,items): CONVERSATIONS.append((title,dialogue,items))
def t(title,talk,items): TALKS.append((title,talk,items))

c("Rehearsal turnaround time",
"""W: The jazz quartet can finish its rehearsal at five forty-five. Will that leave enough time before we open the theater doors at six?
M: Not if the camera crew still needs to remove its lighting stands. We'd be trying to reset the stage while the audience is arriving.
W: We could use a bit of breathing room. I'll ask the quartet to rehearse in the studio downstairs instead; their instruments can be moved up after the camera crew leaves.
M: That would let us finish the stage check before admitting anyone.""",[
("Where does the conversation most likely take place?","At a performance venue|At a medical clinic|At a railway ticket office|At a furniture factory","Họ nói về sân khấu, ban nhạc, khán giả và giờ mở cửa nhà hát."),
("What does the woman mean by saying, “We could use a bit of breathing room”?","They need more time between activities|The theater has no ventilation|The quartet should play more quietly|The camera crew needs a larger office","Đây là cách nói cần khoảng thời gian đệm, không phải vấn đề không khí."),
("What will the woman ask the quartet to do?","Rehearse in a different room|Remove the camera lighting|Cancel the performance|Open the theater doors early","Cô sẽ xin chuyển diễn tập xuống studio tầng dưới, nhạc cụ chuyển lên sau."),])

c("Comparable cleaning bids",
"""M: The lowest cleaning bid is nearly a third cheaper. Can we accept it before the committee meeting?
W: Not yet. The cheaper bid covers the offices only, while the other two include the stairwells and the shared kitchen. We're not comparing like for like.
M: So the apparent saving might disappear once those areas are added.
W: Exactly. I'll ask the first company to price the same scope. Then the committee can compare cost and service conditions on a consistent basis.""",[
("What are the speakers reviewing?","Cleaning-service quotations|Staff travel claims|Kitchen equipment warranties|Committee membership applications","Họ so báo giá dịch vụ vệ sinh, đặc biệt phạm vi các khu vực.",),
("What does the woman mean by saying, “We're not comparing like for like”?","The bids cover different work|The lowest bidder has withdrawn|All prices are calculated incorrectly|The committee has already selected a supplier","Câu nói chỉ việc phạm vi khác nhau, không chứng minh lỗi tính giá hay rút thầu.",),
("What will the woman do next?","Request a quotation for the same scope|Accept the cheapest bid immediately|Remove the shared areas from every contract|Cancel the committee meeting","Cô sẽ yêu cầu công ty đầu báo cùng phạm vi rồi mới so sánh.",)])

c('Late exhibit crates',
"""M: The museum opens its ceramics exhibition on Saturday, but the crates from the lender are still at the airport. I thought the truck was arriving this morning.
W: It was, until the customs office requested an updated insurance certificate. Our registrar has sent that now. The carrier expects clearance tonight, but cannot promise it.
M: Then let's put photographs in the three empty display cases for the press preview. I'll ask the designer to print labels explaining that the objects are in transit.""",[
("Where do the speakers most likely work?","At a museum|At an insurance agency|At an airport café|At a ceramics factory","Họ chuẩn bị triển lãm, tủ trưng bày và buổi xem trước cho báo chí: bối cảnh bảo tàng."),
("What has prevented the crates from being released?","A documentation requirement|A shortage of display cases|Damage to the truck|An unpaid design invoice","Hải quan cần chứng nhận bảo hiểm cập nhật; không có thông tin kiện hàng hỏng."),
("What does the man propose for the press preview?","Displaying images temporarily|Canceling the entire exhibition|Moving the preview to the airport|Borrowing objects from the designer","Ảnh và nhãn sẽ tạm thay hiện vật đang vận chuyển; chưa hủy triển lãm.")])
c('Mobile checkout trial',
"""W: Customers liked the handheld checkout devices yesterday, but the exit queue was longer than usual. Was the wireless connection slow?
M: The connection was fine. Each sale needed a printed receipt, and both devices were sending jobs to one printer behind the service counter.
W: We already have a spare printer in the stockroom. Could you connect it before today's trial? Keep one device at each end of the store so we can compare the waiting times separately.
M: I'll do that before the doors open.""",[
("What caused the longer queue?","A shared receipt printer|A failed wireless network|A shortage of handheld devices|An unexpectedly late opening","Hai thiết bị cùng in vào một máy; mạng vẫn hoạt động bình thường."),
("What will the man do before opening?","Set up another printer|Order a stronger router|Close the service counter|Cancel the checkout trial","Có máy in dự phòng trong kho, anh ấy sẽ kết nối trước giờ mở cửa."),
("Why will the devices be placed separately?","To compare waiting times|To prevent customers paying by card|To make space for a new stockroom|To reduce the number of receipts","Hai vị trí cho phép so sánh thời gian chờ, không thay đổi cách thanh toán.")])
c('Roof inspection access',
"""M: The roof inspector is here, but her access badge won't open the stairwell. Should I send her to the security office?
W: No, the office is closed until nine. The facilities supervisor can escort contractors, and he's checking the heating controls in the basement.
M: The inspection has to finish before the solar installers arrive at ten. I'll call him now and ask him to meet us beside the freight elevator.
W: Good. Tell him the inspector has already signed the visitor register.""",[
("What problem is being discussed?","An inspector cannot enter a stairwell|Solar panels were delivered incorrectly|A heating inspection was canceled|The freight elevator is broken","Thẻ của kiểm định viên không mở được lối cầu thang; không nói thang máy hỏng."),
("Who can resolve the immediate access problem?","The facilities supervisor|A solar-panel supplier|The visitor registrar|A security clerk arriving at ten","Giám sát cơ sở vật chất được phép hộ tống nhà thầu khi văn phòng an ninh đóng."),
("What will the man most likely do next?","Contact someone in the basement|Install a replacement badge reader|Postpone the solar installation|Take over the roof inspection","Anh ấy sẽ gọi giám sát đang ở tầng hầm; không tự kiểm định mái.")])
c('Coffee subscription address',
"""W: My café's coffee subscription still lists the old delivery address, even though I changed it in the customer portal last week.
M: Portal changes apply to future orders. This month's order had already been packed, but the delivery vehicle hasn't left yet. I can ask dispatch to relabel it.
W: Please do. The new premises have a narrow entrance, so the driver should use the alley behind the bakery, not the front door.
M: I'll add that instruction and email you a corrected delivery notice.""",[
("Why did the old address remain on the order?","The order was packed before the change applied|The portal rejected the new street name|The customer changed cafés again|The driver could not locate a bakery","Đổi địa chỉ chỉ áp dụng cho đơn tương lai; đơn tháng này đã đóng gói."),
("Why is a redirection still possible?","The vehicle has not departed|The order has not been paid for|The coffee has not been roasted|The customer lives beside the warehouse","Xe chưa rời kho nên còn có thể thay nhãn."),
("What special instruction does the woman give?","Use a rear access route|Leave the coffee inside the bakery|Deliver only after dark|Collect payment at the front door","Cô yêu cầu dùng ngõ phía sau tiệm bánh vì cửa trước hẹp.")])
c('Volunteer briefing subtitles',
"""M: I've finished the video for our volunteer briefing. Can you put it on the registration page this afternoon?
W: The content is ready, but the subtitles disappear against the white background in the last section. Some volunteers will watch without sound on the bus.
M: I could darken the entire scene, although that would obscure the demonstration.
W: Put a shaded strip behind the words instead. Keep the original lighting. Once you've exported that version, I'll check it on my phone before publishing it.""",[
("What aspect of the video needs changing?","The readability of its captions|The length of its introduction|The accuracy of its registration link|The volume of the narration","Vấn đề là phụ đề khó đọc trên nền trắng, không phải âm lượng."),
("Why does the woman reject darkening the scene?","It would hide useful visual information|It would remove the subtitles|It would delay the bus service|It would change the registration deadline","Làm tối cả cảnh sẽ che phần trình diễn; nền riêng phía sau chữ giữ được hình ảnh."),
("What will the woman do before publication?","Review the revised video on a mobile device|Record a new demonstration|Print briefing handouts|Ask volunteers to bring headphones","Sau khi xuất bản sửa, cô sẽ kiểm tra trên điện thoại.")])
c('Lunch delivery temperature',
"""W: Three departments said their lunches were cold yesterday. The kitchen checked the containers, and the seals were intact.
M: Our courier combined all three deliveries into one route. He waited at the first building because its loading area was occupied, then arrived late at the others.
W: We can't control that building's loading area. For the rest of this week, send the downtown orders on a separate bicycle route. It's a shorter trip, even if it costs a little more.
M: I'll revise the dispatch schedule.""",[
("What most likely contributed to the cold meals?","A delay early in the delivery route|Damaged container seals|A failure to cook the food|An incorrect department list","Tài xế phải chờ ở điểm đầu nên các điểm sau nhận trễ; niêm phong vẫn nguyên."),
("What change is proposed?","Separating some orders onto another route|Replacing every food container|Asking customers to collect their lunches|Reducing portion sizes","Đơn khu trung tâm sẽ đi tuyến xe đạp riêng, không đổi hộp hay khẩu phần."),
("What trade-off does the woman accept?","A higher delivery cost|A later kitchen opening|A smaller menu|A longer registration period","Cô chấp nhận chi phí tăng nhẹ để hành trình ngắn hơn.")])
c('Expense claim duplicate',
"""M: Your expense form includes two taxi fares for Tuesday morning. Did you travel to two client sites?
W: Only one. The driver canceled the first trip, and the app sent a receipt before reversing the charge. I attached both messages by mistake.
M: Then remove the canceled fare and attach the reversal confirmation. The remaining fare is within the daily allowance.
W: I'll resubmit it before lunch. Could you leave the claim open rather than rejecting the whole report? My hotel receipt has already been approved.""",[
("Why were two taxi receipts submitted?","A canceled trip was included accidentally|The employee visited two sites|The daily allowance was doubled|A hotel charged for transportation","Một chuyến bị hủy và hoàn phí nhưng biên nhận được đính kèm nhầm."),
("What must accompany the revised claim?","Confirmation of the reversed charge|A second hotel receipt|Approval for a higher allowance|A map of both client sites","Cần xác nhận hoàn khoản đã hủy, không cần chứng từ khách sạn mới."),
("Why does the woman ask to keep the report open?","Part of it has already been approved|She has not taken the trip yet|The hotel will issue a new invoice|She expects another taxi fare","Hóa đơn khách sạn đã duyệt nên cô muốn sửa phần taxi mà giữ phần hợp lệ.")])
c('Community room acoustics',
"""W: The community room looks excellent after renovation, but the rehearsal recording has a strong echo. We need somewhere suitable for next week's spoken-word workshop.
M: The curtains haven't arrived yet. They're not just decorative; they'll absorb sound along the glass wall. Delivery is scheduled for Friday.
W: That's after our practice session. Could we use the upstairs meeting room for the rehearsal and move back here for the actual workshop?
M: Yes. I'll reserve it and ask the installer to test this room once the curtains are hung.""",[
("What is the woman's concern?","The room's sound quality|The workshop's ticket sales|The color of the curtains|The size of the upstairs windows","Bản thu có tiếng vang; đây là vấn đề âm học."),
("What is indicated about the curtains?","They serve an acoustic purpose|They must be removed for recording|They were damaged during renovation|They have already been installed","Rèm hấp thụ âm dọc tường kính, không chỉ để trang trí."),
("Where will the rehearsal probably take place?","In an upstairs meeting room|At the curtain supplier|In the renovated community room|Outside the building","Buổi diễn tập trước ngày giao rèm sẽ dùng phòng họp tầng trên.")])
c('Charging station permit',
"""M: The installer can fit our new vehicle chargers on Wednesday, but the permit portal still says pending.
W: I called the city. The electrical drawing is acceptable; they only need the property owner's signature on the access form. Our lease doesn't authorize us to sign for her.
M: She is abroad this week. Will an electronic signature do?
W: Yes, according to the permit officer. Email her the form today and copy me. We should keep Wednesday provisional until the city confirms approval.""",[
("What is holding up the permit?","A missing owner signature|An unsuitable electrical design|An expired installer license|A change in the lease price","Bản vẽ được chấp nhận; thiếu chữ ký chủ sở hữu trên mẫu quyền tiếp cận."),
("Why can the speakers not sign the form themselves?","Their lease does not give them that authority|The portal is unavailable abroad|They have not hired an electrician|The city requires handwritten forms","Hợp đồng thuê không cho phép họ ký thay chủ sở hữu; chữ ký điện tử được chấp nhận."),
("What does the woman recommend about Wednesday?","Treating it as tentative|Canceling it permanently|Starting work without approval|Moving it to a public holiday","Giữ lịch tạm thời, chỉ xác nhận sau khi thành phố phê duyệt.")])
c('Training attendance evidence',
"""W: The attendance report says only twelve employees completed the safety webinar, but I counted nineteen on screen.
M: Seven people joined from a shared conference-room computer. The platform recorded one account rather than each person. Did the local supervisor keep a sign-in sheet?
W: She did, and she also collected the follow-up quizzes.
M: Ask her to send both documents. We can reconcile the report using those records, but we shouldn't mark anyone complete just because their name appeared in the invitation list.""",[
("Why is the platform total lower than expected?","Several people shared one login|Some invitations were not delivered|The webinar started late|The supervisor lost all the quizzes","Nhiều người xem chung một máy nên hệ thống không ghi nhận từng cá nhân."),
("Which records will help correct the report?","A sign-in sheet and completed quizzes|A room invoice and an invitation list|Employee photographs and travel forms|A recording license and a seating plan","Danh sách ký tên cùng bài kiểm tra sau buổi học là bằng chứng tham gia."),
("What does the man caution against?","Assuming invitees completed the training|Using more than one conference room|Sending documents electronically|Asking a supervisor to verify attendance","Được mời không có nghĩa đã hoàn thành; không tự đánh dấu theo danh sách thư mời.")])
c('Bakery equipment lease',
"""M: The mixer lease looks cheaper than buying, but I can't find who pays for maintenance after the first year.
W: The first page lists routine servicing as included. The exclusion on page four concerns damage from using the wrong voltage, not normal wear.
M: That's reassuring. Still, the renewal price isn't fixed, and we expect to open another bakery next spring.
W: Then request a purchase option in writing. It would let us keep this machine without accepting an unknown second-year rate.""",[
("What is clarified about routine servicing?","It is included in the lease|It is excluded after one month|It requires a separate technician contract|It covers every type of electrical damage","Bảo trì định kỳ đã bao gồm; loại trừ chỉ nói hỏng do sai điện áp."),
("What uncertainty concerns the man?","The price when the lease renews|The location of the first bakery|The voltage required by the building|The number of mixers delivered","Giá gia hạn chưa cố định, không phải phí bảo trì thông thường."),
("What will they probably request?","A written option to buy the mixer|A shorter mixing demonstration|A refund for the first year's service|Permission to use a different voltage","Quyền mua lại bằng văn bản giúp tránh phải nhận giá thuê năm hai chưa biết.")])
c('Survey sample balance',
"""W: The customer survey has three hundred responses now. Can we recommend extending the weekend opening hours?
M: Most responses came through the weekday newsletter. Weekend customers rarely receive it, so the results may not represent the group we're trying to help.
W: Then we need another way to reach them. Let's put a short survey code on receipts this Saturday and Sunday, and keep those answers separate initially.
M: Agreed. We'll compare the two groups before writing the recommendation, rather than simply adding up all the votes.""",[
("What limitation does the man identify?","The respondents may not represent weekend customers|The survey asks no questions about opening hours|The shop has fewer than three hundred customers|The newsletter was sent on Sunday","Đa số phản hồi đến từ bản tin ngày thường nên mẫu có thể lệch so với khách cuối tuần."),
("How will additional responses be collected?","Through a code printed on receipts|By extending the shop's hours immediately|By calling only newsletter subscribers|Through a mandatory membership fee","Họ sẽ in mã khảo sát trên hóa đơn thứ Bảy và Chủ nhật."),
("What will happen before a recommendation is made?","The two respondent groups will be compared|All weekday responses will be deleted|Customers will vote on a new logo|A second shop will be opened","So sánh hai nhóm trước khi khuyến nghị; không cộng máy móc toàn bộ phiếu.")])
c('Garden irrigation warranty',
"""M: The irrigation controller has stopped working again. The supplier offered a free replacement, so why hasn't the maintenance team accepted it?
W: The replacement is the same model. Our outdoor cabinet gets hotter than the model's operating limit, and fitting another identical unit may only repeat the problem.
M: Could we move the cabinet into the shade?
W: That requires new wiring. I've asked the supplier to quote a higher-temperature model as well, so we can compare the total cost of both solutions before deciding.""",[
("Why is the free replacement not accepted immediately?","It may have the same suitability problem|The warranty has already expired|The supplier no longer makes controllers|The team has ordered new garden plants","Máy cùng mẫu có thể lại vượt giới hạn nhiệt; đổi miễn phí chưa chắc xử lý nguyên nhân."),
("What would relocating the cabinet involve?","Installing new wiring|Canceling the garden service|Replacing every water pipe|Removing the supplier warranty","Di chuyển tủ sang chỗ râm cần đi lại dây điện."),
("What is the woman comparing?","Two ways of resolving an overheating problem|Two gardening schedules|Two expired maintenance invoices|Two identical free controllers","Cô so tổng chi phí dời tủ và dùng bộ điều khiển chịu nhiệt tốt hơn.")])
c('Conference interpreter channel',
"""W: The interpreter can hear the presenter, but the remote participants can't hear her translation. Her microphone meter is moving, so it isn't muted.
M: She's connected to the main meeting instead of the interpretation channel. If she speaks there, everyone hears both languages at once.
W: I'll move her into the correct channel. Please send the audience a screenshot showing where to choose their language; several people joined after the instructions.
M: I'll send that now, and we'll test it during the five-minute break.""",[
("What is causing the audio problem?","The interpreter is in the wrong channel|The interpreter's microphone is muted|The presenter has disconnected|The break is too short","Cô phiên dịch kết nối nhầm kênh, dù đồng hồ mic vẫn có tín hiệu."),
("Why will a screenshot be sent?","Some participants missed the instructions|The interpreter needs a new camera|The presenter requested a printed transcript|The meeting room has no screen","Một số người vào muộn nên chưa biết chọn ngôn ngữ."),
("When will the solution be tested?","During a scheduled break|After the whole conference ends|Before invitations are sent|At the next monthly meeting","Họ sẽ kiểm tra trong giờ nghỉ năm phút, không đợi hội nghị kết thúc.")])
c('Returnable packaging pilot',
"""M: Our reusable delivery boxes are popular, but fewer than half have come back. Should we raise the deposit?
W: Before changing the price, look at the return locations. Customers can only bring boxes to our warehouse, which closes before most people finish work.
M: The corner grocery is open until ten. Perhaps it could accept returns for a small handling fee.
W: Ask the owner. If she agrees, we'll run a four-week collection trial and measure the return rate before adjusting the deposit.""",[
("What possible explanation is given for the low return rate?","The return location is inconvenient|The boxes are too fragile|Customers were charged no deposit|The grocery closes at noon","Kho đóng sớm, khách khó đến trả sau giờ làm."),
("What alternative is suggested?","Using a grocery as a collection point|Stopping all reusable deliveries|Doubling every customer deposit immediately|Replacing boxes with paper envelopes","Cửa hàng tạp hóa mở muộn có thể nhận lại hộp."),
("What will they evaluate during the trial?","The proportion of boxes returned|The number of warehouse employees|The grocery's electricity usage|The color preferences of new customers","Thử bốn tuần để đo tỷ lệ hoàn trả trước khi quyết định tăng tiền cọc.")])
c('Clinic appointment wording',
"""W: Patients keep arriving at the wrong entrance for evening appointments. The reminder says to use the north door, but that's the name on our floor plan, not on the street signs.
M: The sign outside says Garden Entrance. We should use that wording and mention the pharmacy across the road as a landmark.
W: I'll update tomorrow's messages, but today's reminders have already gone out.
M: Then put a temporary notice on the main door this afternoon. I'll ask reception to mention it when confirming appointments by phone.""",[
("Why have patients been confused?","The reminder uses an unfamiliar entrance name|The clinic changed its appointment times|The pharmacy has closed permanently|The floor plan shows no doors","Lời nhắc dùng tên trên sơ đồ nội bộ, trong khi biển ngoài ghi Garden Entrance."),
("What will be added to future messages?","A recognizable landmark|A different appointment fee|The pharmacy's prescription list|A new clinic telephone number","Cần thêm hiệu thuốc đối diện làm mốc và dùng tên biển bên ngoài."),
("Why is a temporary notice needed today?","The existing reminders have already been sent|The new door has not been installed|The main door will be demolished|Reception cannot make telephone calls","Tin nhắn hôm nay đã gửi nên cần biển bổ sung ngay thay vì chờ bản sửa ngày mai.")])
c('Bookshop signed editions',
"""M: We received the author's books for Saturday's event, but only twenty copies have signed bookplates. We advertised thirty signed copies.
W: The publisher sent the remaining plates separately. Tracking shows they should arrive tomorrow, although the books are here already.
M: Let's hold the unsigned copies off the event table until the plates arrive. We can still sell ordinary editions from the main shelves.
W: I'll update the reservation list and make sure customers who prepaid for signed copies get priority. We shouldn't promise extras until we've counted everything.""",[
("What is still expected from the publisher?","Additional signed inserts|A replacement shipment of all books|A new event advertisement|A list of ordinary retail prices","Sách đã đến; phần đang thiếu là các tấm ký tên gửi riêng."),
("What can continue while the shipment is awaited?","Sales of standard editions|Distribution of all signed reservations|Promises of unlimited signed copies|Returns of every delivered book","Bản thông thường trên kệ chính vẫn bán được; bản ký tên phải kiểm đủ."),
("Who will receive priority?","Customers who prepaid for signed copies|Visitors who arrive without reservations|Employees of the delivery company|Everyone buying an ordinary edition","Ưu tiên người đã trả trước để đặt bản có chữ ký.")])
c('Hotel linen trial',
"""W: The new linen supplier's samples feel softer, but housekeeping says they take longer to dry. The quoted price alone doesn't show that cost.
M: We should run them through a full laundry cycle alongside our current sheets. Measure drying time and check shrinkage after several washes.
W: I'll ask the laundry supervisor to arrange that. The supplier wants a decision by Friday, but I don't want to sign before the trial finishes.
M: Request a week's extension. A discount won't help if the daily laundry schedule becomes unworkable.""",[
("What concern is raised about the samples?","Their effect on laundry operations|Their lack of softness|Their inaccurate room labels|Their inability to fit in delivery boxes","Vải mềm hơn nhưng lâu khô, có thể tăng chi phí và ảnh hưởng vận hành."),
("What comparison is proposed?","Testing the new and existing sheets under the same conditions|Comparing only the listed purchase prices|Using the new sheets only in vacant rooms|Asking guests to wash their own sheets","Giặt cùng điều kiện để so thời gian sấy và độ co sau nhiều lần."),
("Why will an extension be requested?","The practical evaluation needs more time|The supplier has already canceled the order|The hotel closes on Friday|The quoted price is missing all taxes","Cần đủ thời gian thử trước khi ký, không chỉ chạy theo chiết khấu.")])
c('Distribution label language',
"""M: The carton labels for our first shipment to Montreal are ready. I used the English artwork from the domestic order.
W: This customer requested bilingual handling instructions. The product names can stay as they are, but the storage and safety lines need French too.
M: The shipment is booked for tomorrow. Can we add a second label rather than reprinting the entire carton design?
W: Yes, provided the customer approves the translated wording first. Send the proof this morning and keep the cartons in the packing area until we hear back.""",[
("Which information needs an additional language?","Storage and safety instructions|Every product name|The domestic customer's address|The carrier's tracking number","Khách yêu cầu song ngữ cho hướng dẫn lưu kho và an toàn; tên sản phẩm giữ nguyên."),
("What solution is proposed?","Applying an additional label|Replacing the whole product range|Sending the shipment without instructions|Canceling all domestic orders","Dùng nhãn bổ sung thay vì in lại toàn bộ thiết kế thùng."),
("What must happen before the cartons are released?","The customer must approve the wording|The carrier must translate every invoice|The factory must change its address|The domestic order must be returned","Khách cần duyệt bản dịch; thùng sẽ ở khu đóng gói đến khi có phản hồi.")])
c('City bike rack placement',
"""W: The proposed bicycle rack fits beside the café, but the accessibility officer says it narrows the path below the required width.
M: The drawing shows the rack parallel to the wall. What if we rotate it and place it in the unused loading recess instead?
W: That recess is reserved for deliveries before eleven. We could use the space beyond the planter, as long as the café agrees to move its menu board.
M: I'll ask the owner and have the designer revise the drawing. We need clear pedestrian access throughout the day.""",[
("Why is the original position unsuitable?","It restricts pedestrian clearance|It is too far from a wall|It blocks a railway crossing|It receives no sunlight","Vị trí ban đầu làm lối đi hẹp dưới chuẩn tiếp cận."),
("Why is the loading recess rejected?","It has a scheduled delivery use|It belongs to another city|It contains a permanent bicycle rack|It cannot be shown on a drawing","Hốc này vẫn dùng giao hàng buổi sáng nên không thể chiếm cả ngày."),
("What will the man seek permission to move?","A café menu board|The pedestrian crossing|The accessibility office|A delivery vehicle","Phương án mới cần quán đồng ý dời bảng thực đơn.")])
