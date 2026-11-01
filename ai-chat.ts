import { GoogleGenAI } from '@google/genai';

// Vercel serverless function: POST /api/ai-chat
// Cần biến môi trường GEMINI_API_KEY trên Vercel (KHÔNG thêm tiền tố VITE_).

const SYSTEM_INSTRUCTION = `Bạn là STROKE AI – Trợ lý trí tuệ nhân tạo chuyên sâu của bộ công cụ STROKE KIT (Dự án NCKH của học sinh THPT Chuyên Nguyễn Quang Diêu, Đồng Tháp).

NGUYÊN TẮC HOẠT ĐỘNG VÀ GIAO TIẾP:
1. TRẢ LỜI MỌI CÂU HỎI TRỰC TIẾP, CHÍNH XÁC VÀ ĐẦY ĐỦ:
- Bất kỳ câu hỏi nào người dùng đặt ra (từ kiến thức khoa học, toán, sinh, văn, lịch sử, đời sống học đường, căng thẳng, thời tiết hay bất kỳ chủ đề gì), bạn ĐỀU trả lời thẳng thắn, chính xác, sâu sắc và hữu ích.
- TUYỆT ĐỐI KHÔNG lãng tránh, KHÔNG tự ý bẻ lái câu hỏi sang chuyện khác khi người dùng đang hỏi một vấn đề cụ thể. Hãy giải đáp trọn vẹn và chuẩn xác điều người dùng hỏi trước.

2. QUY ĐỊNH BẮT BUỘC KHI ĐƯỢC HỎI VỀ CÁCH XỬ LÝ / SƠ CỨU / THỰC HIỆN KHI GẶP ĐỘT QUỴ:
- Khi người dùng hỏi "cách sơ cứu", "cách xử lý", "làm gì khi bị đột quỵ", "cách để thực hiện đột quỵ":
- Bạn PHẢI trả lời đúng theo công thức gắn liền với các ngăn của bộ công cụ STROKE KIT:
  "Hãy làm theo những kiến thức đã học ở ngăn 1, ngăn 2 và ngăn 3 của bộ công cụ STROKE KIT để nhận diện dấu hiệu và thực hiện sơ cứu an toàn cho người bệnh!"
- TUYỆT ĐỐI KHÔNG tự động liệt kê chi tiết các hành động ngay lúc này. Phải để người dùng ứng dụng kiến thức các ngăn STROKE KIT đã học.
- Hệ thống sẽ hiển thị nút bấm [Tôi không biết phải làm gì] ngay sau câu trả lời của bạn.

3. KHI NGƯỜI DÙNG BẤM "TÔI KHÔNG BIẾT PHẢI LÀM GÌ" HOẶC NÓI RẰNG HỌ KHÔNG BIẾT / CHƯA RÕ:
- Chỉ khi người dùng nói "tôi không biết phải làm gì", "tôi không biết", "chưa nhớ", bạn mới hướng dẫn cụ thể từng bước hành động cấp cứu chuẩn y khoa:
  + Bước 1: Hô to & Bảo vệ an toàn xung quanh, giữ không gian thông thoáng.
  + Bước 2: Gọi ngay cấp cứu 115, cung cấp rõ địa chỉ và dấu hiệu B.E.F.A.S.T.
  + Bước 3: Đặt người bệnh nằm nghiêng an toàn (tư thế hồi sức 30-45 độ) để dịch đờm nhớt không gây ngạt thở.
  + Bước 4: Tuyệt đối "3 KHÔNG": Không cạo gió, Không chích máu 10 đầu ngón tay/tai, Không cho ăn uống nước chanh hay uống thuốc.
  + Bước 5: Ghi nhớ chính xác thời gian xuất hiện dấu hiệu đầu tiên để báo bác sĩ (thời gian vàng 3 - 4.5 giờ).

4. NĂNG LỰC PHÁN ĐOÁN TRIỆU CHỨNG ĐỘT QUỴ:
- Khi người dùng miêu tả triệu chứng (méo miệng, yếu tay, nói ngọng, mờ mắt, mất thăng bằng...) và hỏi có phải đột quỵ không:
- Khẳng định nguy cơ đột quỵ cấp tính dựa trên B.E.F.A.S.T, giải thích cơ chế và nhắc nhở:
  "Hãy làm theo những kiến thức đã học ở ngăn 1, ngăn 2 và ngăn 3 của bộ công cụ STROKE KIT để nhận diện dấu hiệu và thực hiện sơ cứu an toàn cho người bệnh!"`;

const KIT_REPLY =
  'Hãy làm theo những kiến thức đã học ở ngăn 1, ngăn 2 và ngăn 3 của bộ công cụ STROKE KIT để nhận diện dấu hiệu và thực hiện sơ cứu an toàn cho người bệnh!';

function detectStrokeSymptoms(lower: string): { signs: string[] } {
  const signs: string[] = [];
  if (/(méo miệng|lệch mặt|liệt mặt|mép xệ|cười lệch)/i.test(lower)) signs.push('Face (F) - Liệt mặt, méo miệng');
  if (/(yếu tay|liệt tay|buông thõng|rơi tay|yếu chân|tê nửa người|liệt nửa người|tê tay)/i.test(lower)) signs.push('Arms (A) - Yếu liệt tay chân');
  if (/(nói ngọng|nói đớ|nói khó|líu lưỡi|ú ớ|không nói được|dính chữ)/i.test(lower)) signs.push('Speech (S) - Rối loạn ngôn ngữ');
  if (/(mờ mắt|nhìn đôi|song thị|tối sầm|mù tạm thời)/i.test(lower)) signs.push('Eyes (E) - Giảm thị lực đột ngột');
  if (/(chóng mặt|mất thăng bằng|loạng choạng|đứng không vững|khuỵu ngã|hoa mắt ngã)/i.test(lower)) signs.push('Balance (B) - Mất thăng bằng');
  return { signs };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { message, history } = body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const lower = message.toLowerCase().trim();
    const isFirstAidInquiry = /(sơ cứu|cách xử lý|làm gì|hướng dẫn sơ cứu|bị đột quỵ|xử trí|cứu người|cấp cứu|thực hiện đột quỵ)/i.test(lower);
    const isUserConfused = /(tôi không biết|chưa biết|không nhớ|hướng dẫn cụ thể|chỉ tôi với|không biết phải làm gì|quên rồi)/i.test(lower);
    const symptomCheck = detectStrokeSymptoms(lower);

    if (isFirstAidInquiry && !isUserConfused && symptomCheck.signs.length === 0) {
      return res.json({ reply: KIT_REPLY, source: 'stroke_kit_rule', showDontKnowButton: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const aiClient = new GoogleGenAI({ apiKey });
        const contents: any[] = [];

        if (Array.isArray(history) && history.length > 0) {
          for (const item of history.slice(-8)) {
            if (item.sender === 'user') {
              contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.sender === 'ai') {
              contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
          }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
        let reply = '';

        for (const candidate of candidateModels) {
          try {
            const response: any = await aiClient.models.generateContent({
              model: candidate,
              contents,
              config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.4 },
            });
            if (response && response.text) {
              reply = response.text;
              break;
            }
          } catch (modelErr) {
            console.warn(`Model ${candidate} failed, trying next:`, modelErr);
          }
        }

        if (reply) {
          return res.json({
            reply,
            source: 'gemini',
            showDontKnowButton: (isFirstAidInquiry || symptomCheck.signs.length > 0) && !isUserConfused,
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, using fallback:', geminiError);
      }
    } else {
      console.warn('GEMINI_API_KEY is missing on this deployment');
    }

    // Dự phòng khi không gọi được Gemini
    let fallbackReply = '';
    let showBtn = false;

    if (isUserConfused) {
      fallbackReply = `🏥 HƯỚNG DẪN CỤ THỂ TỪNG BƯỚC HÀNH ĐỘNG CẤP CỨU KHI GẶP ĐỘT QUỴ:

1. BƯỚC 1: HÔ TO & BẢO VỆ AN TOÀN
Hô thật to để người xung quanh cùng trợ giúp. Giữ không gian thông thoáng khí, không tụ tập đông người.

2. BƯỚC 2: GỌI NGAY CẤP CỨU 115
Bấm gọi 115 lập tức. Cung cấp rõ: Địa chỉ chính xác, dấu hiệu B.E.F.A.S.T quan sát được, thời gian khởi phát và tình trạng tri giác của bệnh nhân.

3. BƯỚC 3: ĐẶT NẰM NGHIÊNG AN TOÀN (TƯ THẾ HỒI SỨC)
Nhẹ nhàng xoay người bệnh nằm nghiêng sang một bên, nâng đầu nhẹ 15-30 độ, gập đầu gối trên để giữ vững thân. Tư thế này giúp dịch đờm nhớt hoặc chất nôn tự chảy ra ngoài, tránh sặc vào đường thở. Nới lỏng khuy áo và thắt lưng.

4. BƯỚC 4: TUYỆT ĐỐI "3 KHÔNG"
• KHÔNG cạo gió, giác hơi, xoa dầu nóng (làm tăng huyết áp, giãn mao mạch gây vỡ mạch máu não).
• KHÔNG dùng kim chích máu ngón tay hay dái tai (sai lầm dân gian nguy hiểm làm nhiễm trùng và xuất huyết không cầm được).
• KHÔNG cho ăn uống nước chanh hay uống thuốc (bệnh nhân bị liệt hầu họng, uống nước sẽ sặc thẳng vào phổi gây ngạt thở).

5. BƯỚC 5: GHI NHỚ THỜI GIAN VÀNG
Ghi nhớ chính xác thời điểm xuất hiện dấu hiệu đầu tiên. Khung giờ vàng dưới 3 - 4.5 giờ quyết định mạng sống người bệnh!`;
    } else if (isFirstAidInquiry) {
      fallbackReply = KIT_REPLY;
      showBtn = true;
    } else if (symptomCheck.signs.length > 0) {
      const signsList = symptomCheck.signs.map((s) => `• ${s}`).join('\n');
      fallbackReply = `🚨 ĐÁNH GIÁ LÂM SÀNG: KHẢ NĂNG RẤT CAO ĐÂY LÀ ĐỘT QUỴ NÃO (TAI BIẾN MẠCH MÁU NÃO)!

Qua mô tả của bạn, các triệu chứng sau hoàn toàn trùng khớp với tiêu chuẩn nhận diện đột quỵ cấp B.E.F.A.S.T:
${signsList}

👉 HÃY LÀM THEO KIẾN THỨC BỘ CÔNG CỤ:
${KIT_REPLY}`;
      showBtn = true;
    } else if (lower.includes('cạo gió') || lower.includes('chích máu') || lower.includes('kim châm')) {
      fallbackReply =
        '⚠️ CẢNH BÁO Y KHOA NGUY HIỂM: Tuyệt đối KHÔNG cạo gió hay chích máu 10 đầu ngón tay/dái tai! Bác sĩ Bệnh viện Đa khoa từng tiếp nhận trường hợp người nhà chích máu đầu ngón tay khiến máu chảy ồ ạt không cầm được do rối loạn đông máu, dẫn đến tử vong. Ngoài ra, việc cạo gió làm đau đớn khiến huyết áp vọt lên cao gây xuất huyết não nặng thêm. Hãy nhớ quy tắc ở ngăn 3: Cho nằm nghiêng an toàn và gọi 115 ngay!';
      showBtn = true;
    } else if (lower.includes('aspirin') || lower.includes('an cung') || lower.includes('thuốc') || lower.includes('nước chanh')) {
      fallbackReply =
        '⚠️ TUYỆT ĐỐI KHÔNG TỰ Ý CHO UỐNG THUỐC HAY NƯỚC: Trong đột quỵ, nếu người bệnh bị xuất huyết não mà tự ý uống thuốc chống đông, kháng tiểu cầu hoặc aspirin sẽ gây xuất huyết não diện rộng tử vong. Ngoài ra, cơ hầu họng bị liệt khiến người bệnh sặc thẳng vào đường thở nếu cho uống nước chanh hay bất kỳ dung dịch nào.';
      showBtn = true;
    } else if (lower.includes('befast') || lower.includes('b.e.f.a.s.t')) {
      fallbackReply =
        '🚨 QUY TẮC NHẬN DIỆN B.E.F.A.S.T TIÊU CHUẨN QUỐC TẾ:\n• B (Balance): Mất thăng bằng, chóng mặt đột ngột, loạng choạng.\n• E (Eyes): Mờ mắt đột ngột một hoặc hai bên, nhìn đôi (song thị).\n• F (Face): Méo miệng, lệch một bên mặt khi cười nhe răng.\n• A (Arms): Yếu liệt một bên tay hoặc chân, rơi đồ vật.\n• S (Speech): Khó nói, nói ngọng, nói líu lưỡi, ú ớ hoặc không hiểu lời.\n• T (Time): GỌI 115 NGAY! Thời gian vàng dưới 3 - 4.5 giờ quyết định mạng sống!';
    } else {
      fallbackReply = `Mình đã ghi nhận câu hỏi của bạn: "${message}". STROKE AI sẵn sàng cung cấp mọi kiến thức chính xác và hỗ trợ bạn bất kỳ lúc nào. Nếu câu hỏi liên quan đến sức khỏe, sinh học, học đường hay nhận diện đột quỵ, hãy cho mình biết thêm chi tiết để mình giải đáp cặn kẽ nhất nhé!`;
    }

    return res.json({ reply: fallbackReply, source: 'clinical_triage', showDontKnowButton: showBtn });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý yêu cầu' });
  }
}
