/** Authored exact quotations; no inferred or generated evidence for other questions. */
export const readingEvidence: Record<string, { passageId: string; quote: string; note: string }[]> =
  {
    'p7-return': [
      {
        passageId: 'library-notice',
        quote: 'Readers may return books at the service desk or renew them online.',
        note: 'Return books at the service desk là trả sách tại quầy; renew online là gia hạn.',
      },
    ],
    'p7-fees': [
      {
        passageId: 'library-notice',
        quote: 'From June 3 to June 14, the main entrance will be closed for renovation.',
        note: 'June 10 nằm trong khoảng June 3–14.',
      },
      {
        passageId: 'library-notice',
        quote: 'No late fees will be charged for books due during this period.',
        note: 'Kết hợp mốc thời gian với chính sách miễn phí trễ.',
      },
    ],
    'p7-venue': [
      {
        passageId: 'workshop-email',
        quote:
          'Because more employees registered than expected, we have moved the workshop from Room 204 to the conference hall on the ground floor.',
        note: 'Phân biệt địa điểm cũ và địa điểm mới sau have moved.',
      },
    ],
    'p7-bring': [
      {
        passageId: 'workshop-email',
        quote: 'Please bring a laptop.',
        note: 'Yêu cầu trực tiếp với bring; các tài liệu in được cung cấp.',
      },
    ],
    'p7-optional': [
      {
        passageId: 'workshop-email',
        quote: 'Participation is optional, but new team members are encouraged to attend.',
        note: 'Encouraged không đồng nghĩa với bắt buộc.',
      },
    ],
  }
