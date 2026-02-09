"use client";

import Link from 'next/link';

const CATEGORIES = [
    { id: 'cat1', title: 'Category 1', name: '구매한 제품 및 서비스', status: 'available' },
    { id: 'cat2', title: 'Category 2', name: '자본재', status: 'coming-soon' },
    { id: 'cat3', title: 'Category 3', name: '연료 및 에너지 관련 활동', status: 'coming-soon' },
    { id: 'cat4', title: 'Category 4', name: '업스트림 운송 및 유통', status: 'coming-soon' },
    { id: 'cat5', title: 'Category 5', name: '운영 발생 폐기물', status: 'coming-soon' },
    { id: 'cat6', title: 'Category 6', name: '출장', status: 'coming-soon' },
    { id: 'cat7', title: 'Category 7', name: '직원 통근', status: 'coming-soon' },
    { id: 'cat8', title: 'Category 8', name: '업스트림 임대 자산', status: 'coming-soon' },
    { id: 'cat9', title: 'Category 9', name: '다운스트림 운송 및 유통', status: 'coming-soon' },
    { id: 'cat10', title: 'Category 10', name: '판매된 제품의 가공', status: 'coming-soon' },
    { id: 'cat11', title: 'Category 11', name: '판매된 제품의 사용', status: 'coming-soon' },
    { id: 'cat12', title: 'Category 12', name: '판매된 제품의 폐기 처리', status: 'coming-soon' },
    { id: 'cat13', title: 'Category 13', name: '다운스트림 임대 자산', status: 'coming-soon' },
    { id: 'cat14', title: 'Category 14', name: '프랜차이즈', status: 'coming-soon' },
    { id: 'cat15', title: 'Category 15', name: '투자', status: 'coming-soon' },
];

export default function DemoCenter() {
    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            {/* Data Security Banner */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4 shadow-lg text-center">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-sm">
                    <span className="text-xl">🔒</span>
                    <p className="font-medium">
                        <strong>데이터 보안 안내:</strong> 입력하신 모든 데이터는 서버에 저장되지 않으며, 브라우저를 닫으면 즉시 삭제됩니다.
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <header className="text-center mb-16">
                    <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-6 flex items-center justify-center text-3xl">
                        🌱
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
                        GHG Scope 3 데모 센터
                    </h1>
                    <p className="text-gray-400 text-lg">
                        카테고리별 탄소 배출량 산정 시뮬레이션을 체험해보세요.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CATEGORIES.map((cat) => (
                        cat.status === 'available' ? (
                            <Link
                                key={cat.id}
                                href={`/${cat.id}`}
                                className="group p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-teal-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-teal-500 tracking-wider uppercase">{cat.title}</span>
                                    <span className="px-2 py-1 rounded-md bg-teal-500/10 text-teal-500 text-[10px] font-bold">READY</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">{cat.name}</h3>
                                <p className="text-sm text-gray-500">배출원별 산정 및 하이브리드 방식 체험 가능</p>
                            </Link>
                        ) : (
                            <div
                                key={cat.id}
                                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50 opacity-60 cursor-not-allowed"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-gray-600 tracking-wider uppercase">{cat.title}</span>
                                    <span className="px-2 py-1 rounded-md bg-gray-800 text-gray-600 text-[10px] font-bold">COMING SOON</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">{cat.name}</h3>
                                <p className="text-sm text-gray-600">준비 중인 데모입니다.</p>
                            </div>
                        )
                    ))}
                </div>

                <footer className="mt-20 text-center border-t border-gray-900 pt-8">
                    <p className="text-gray-600 text-sm">
                        © OpenBrain GHG Calculator Demo Center
                    </p>
                    <div className="mt-4">
                        <a
                            href="mailto:openbrain.main@gmail.com"
                            className="text-teal-600 hover:text-teal-500 text-sm font-medium"
                        >
                            전체 버전 도입 문의하기
                        </a>
                    </div>
                </footer>
            </main>
        </div>
    );
}
