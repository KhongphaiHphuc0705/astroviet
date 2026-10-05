/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

const planets = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
];
const signs = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];
const houses = [
  'House_1',
  'House_2',
  'House_3',
  'House_4',
  'House_5',
  'House_6',
  'House_7',
  'House_8',
  'House_9',
  'House_10',
  'House_11',
  'House_12',
];

// Pre-generated content for Sun in Signs
const sunInSignsContent: Record<string, string> = {
  Sun_in_Aries:
    'Mặt Trời ở Bạch Dương biểu trưng cho sự khởi đầu, ý chí mạnh mẽ và khát khao khẳng định bản thân. Bạn thường có xu hướng hành động độc lập, tràn đầy năng lượng và luôn sẵn sàng tiên phong trong mọi lĩnh vực. Cần lưu ý rằng sự nôn nóng và thẳng thắn đôi khi có thể khiến bạn trở nên thiếu kiên nhẫn với người khác.',
  Sun_in_Taurus:
    'Mặt Trời ở Kim Ngưu đại diện cho sự ổn định, kiên định và yêu thích những giá trị vật chất vững bền. Bạn thường có xu hướng làm việc chăm chỉ, cẩn trọng và tận hưởng sự bình yên, thoải mái trong cuộc sống. Cần chú ý rằng sự gắn bó quá mức với vùng an toàn có thể khiến bạn đôi khi trở nên cứng nhắc trước những thay đổi.',
  Sun_in_Gemini:
    'Mặt Trời ở Song Tử mang đến sự linh hoạt, trí tò mò và khả năng giao tiếp sắc bén. Bạn thường có xu hướng thích học hỏi, dễ dàng thích nghi với môi trường mới và luôn tìm kiếm những ý tưởng thú vị. Cần lưu ý rằng sự phân tán sự chú ý có thể khiến bạn đôi khi gặp khó khăn trong việc duy trì sự tập trung dài hạn.',
  Sun_in_Cancer:
    'Mặt Trời ở Cự Giải tượng trưng cho cảm xúc sâu sắc, bản năng nuôi dưỡng và sự gắn bó với gia đình. Bạn thường có xu hướng trân trọng những giá trị tinh thần, biết quan tâm và bảo vệ những người thân yêu. Cần chú ý rằng sự nhạy cảm quá mức có thể khiến bạn đôi khi dễ bị tổn thương bởi những lời đánh giá xung quanh.',
  Sun_in_Leo:
    'Mặt Trời ở Sư Tử gắn với nhu cầu được thể hiện bản thân và được ghi nhận. Bạn thường có sức hút tự nhiên và thích dẫn dắt khi làm điều mình tin tưởng. Cần chú ý rằng nhu cầu được công nhận đôi khi có thể khiến bạn nhạy cảm với sự phớt lờ.',
  Sun_in_Virgo:
    'Mặt Trời ở Xử Nữ mang lại sự tỉ mỉ, khả năng phân tích logic và tinh thần phục vụ thực tế. Bạn thường có xu hướng làm việc chỉn chu, thích sắp xếp mọi thứ ngăn nắp và luôn hướng tới sự hoàn thiện. Cần lưu ý rằng tiêu chuẩn cao đôi khi có thể khiến bạn trở nên quá khắt khe với chính mình và người khác.',
  Sun_in_Libra:
    'Mặt Trời ở Thiên Bình biểu tượng cho sự hòa hợp, tính ngoại giao và nhu cầu tìm kiếm sự cân bằng. Bạn thường có xu hướng coi trọng các mối quan hệ, thích sự công bằng và luôn biết cách làm dịu những căng thẳng. Cần chú ý rằng mong muốn làm hài lòng tất cả mọi người có thể khiến bạn đôi khi do dự trong việc đưa ra quyết định.',
  Sun_in_Scorpio:
    'Mặt Trời ở Thiên Yết đại diện cho cường độ cảm xúc, sự biến đổi và trực giác nhạy bén. Bạn thường có xu hướng khao khát tìm hiểu chiều sâu của mọi vấn đề và sở hữu sức mạnh ý chí kiên cường. Cần chú ý rằng sự đa nghi và khao khát kiểm soát có thể khiến bạn đôi khi gặp khó khăn trong việc mở lòng tin tưởng.',
  Sun_in_Sagittarius:
    'Mặt Trời ở Nhân Mã mang đến tinh thần lạc quan, yêu tự do và khát kho mở rộng tầm nhìn. Bạn thường có xu hướng thích khám phá, đam mê học hỏi triết lý và luôn hướng về những viễn cảnh tươi sáng. Cần lưu ý rằng sự thẳng thắn quá mức có thể khiến bạn đôi khi thiếu đi sự tinh tế trong giao tiếp.',
  Sun_in_Capricorn:
    'Mặt Trời ở Ma Kết tượng trưng cho tham vọng, sự kỷ luật và trách nhiệm cao trong công việc. Bạn thường có xu hướng làm việc bền bỉ, xây dựng từng bước vững chắc để đạt được thành tựu dài hạn. Cần chú ý rằng áp lực tự đặt ra đôi khi có thể khiến bạn bỏ quên việc tận hưởng những niềm vui nhỏ bé trong cuộc sống.',
  Sun_in_Aquarius:
    'Mặt Trời ở Bảo Bình biểu trưng cho sự độc đáo, tinh thần đổi mới và lòng hướng ngoại cộng đồng. Bạn thường có xu hướng tư duy khác biệt, thích phá vỡ những quy chuẩn cũ và trân trọng sự tự do cá nhân. Cần chú ý rằng sự khao khát tách biệt đôi khi có thể khiến bạn trở nên xa cách về mặt cảm xúc với những người xung quanh.',
  Sun_in_Pisces:
    'Mặt Trời ở Song Ngư mang lại lòng trắc ẩn, sự đồng cảm và khả năng sáng tạo nghệ thuật phong phú. Bạn thường có xu hướng nhìn đời qua lăng kính lãng mạn, trực giác nhạy bén và sẵn sàng giúp đỡ người khác. Cần chú ý rằng ranh giới cảm xúc mờ nhạt có thể khiến bạn đôi khi dễ bị ảnh hưởng bởi năng lượng tiêu cực từ môi trường.',
};

const contentBank: Record<string, string> = { ...sunInSignsContent };

const dataFiles = ['planets.json', 'ascendant.json', 'houses1.json', 'houses2.json'];

for (const file of dataFiles) {
  const filePath = path.join(process.cwd(), 'scripts', 'data', file);
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.assign(contentBank, content);
  }
}

const items = [];

// 1. PlanetInSign (120)
for (const planet of planets) {
  for (const sign of signs) {
    const key = `${planet}_in_${sign}`;
    const bodyText = contentBank[key] || '[OWNER_CONTENT_REQUIRED]';
    items.push({
      subjectType: 'PlanetInSign',
      subjectKey: key,
      bodyText: bodyText,
    });
  }
}

// 2. AngleInSign (12)
for (const sign of signs) {
  const key = `Ascendant_in_${sign}`;
  const bodyText = contentBank[key] || '[OWNER_CONTENT_REQUIRED]';
  items.push({
    subjectType: 'AngleInSign',
    subjectKey: key,
    bodyText: bodyText,
  });
}

// 3. PlanetInHouse (120)
for (const planet of planets) {
  for (const house of houses) {
    const key = `${planet}_in_${house}`;
    const bodyText = contentBank[key] || '[OWNER_CONTENT_REQUIRED]';
    items.push({
      subjectType: 'PlanetInHouse',
      subjectKey: key,
      bodyText: bodyText,
    });
  }
}

const data = {
  language: 'vi',
  version: '1.0',
  status: 'Published',
  contentSource: 'Hybrid',
  items: items,
};

const outputFilePath = path.resolve(process.cwd(), 'prisma/content/interpretations.vi.json');

// Ensure directory exists
const outputDir = path.dirname(outputFilePath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Generated ${items.length} items to ${outputFilePath}`);
