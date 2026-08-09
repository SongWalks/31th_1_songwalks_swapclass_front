export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'], // 기본 폰트
        paperlogy: ['Paperlogy', 'sans-serif'], // 포인트 제목용 폰트
      },
      colors: {
        // 파란색 계열 (메인/브랜드 컬러)
        brand: {
          navy: '#194059',
          blue: '#1E56AC',
          lightBlue: '#4C9DD1',
          soft: '#C5E4F8',
          bg: '#F4F8FC',
        },
        // 분홍/빨강 계열 (포인트 컬러)
        point: {
          red: '#F34876',
          pink: '#FFCAD9',
          bg: '#FFF2F2',
        },
        // 무채색 계열 (텍스트, 테두리, 배경용)
        gray: {
          900: '#000000',
          700: '#657A88',
          500: '#AFB1B6',
          300: '#D9D9D9',
          100: '#F3F4F6',
          50: '#FBFBFB', // 화면 기본 배경색
          white: '#FFFFFF',
        },
        // 노란색/올리브 계열 (알림/경고용)
        yellow: {
          dark: '#856F00',
          main: '#FFF3B6',
          light: '#FFFBE6',
        },
      },
    },
  },
  plugins: [],
};
