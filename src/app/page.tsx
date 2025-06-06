"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface PhoneNumber {
  number: string;
  deposit: string;
  monthlyFee: string;
  contractPeriod: string;
  islh:string;
}

export default function Home() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  // 恢复 IntersectionObserver 相关代码
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetchNumbers(1, false);
  }, []);

  // 恢复自动加载的 useEffect
  useEffect(() => {
    // 确保在组件挂载后和loading状态变化时重新设置观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          console.log("触发加载更多");
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
      console.log("观察元素已设置");
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, page]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNumbers(nextPage, true);
  };

  // 添加新的状态来存储11个位置的输入值
  const [digitInputs, setDigitInputs] = useState<string[]>(Array(11).fill(''));

  // 处理单个位置的输入变化
  const handleDigitChange = (index: number, value: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = [...digitInputs];
    // 只允许输入数字，且最多一位
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    newDigits[index] = newValue;
    setDigitInputs(newDigits);
    
    // 如果输入了有效数字且不是最后一个输入框，自动跳转到下一个
    if (newValue && index < 10) {
      // 获取所有输入框
      const inputs = document.querySelectorAll('input[type="text"]');
      // 聚焦下一个输入框
      if (inputs[index + 1]) {
        (inputs[index + 1] as HTMLInputElement).focus();
      }
    }
  };

  // 生成搜索参数
  const generateSearchParam = () => {
    return digitInputs.map(digit => digit || '_').join('');
  };

  // 修改搜索处理函数
  // 修改搜索处理函数
  const handleSearch = () => {
    const param = generateSearchParam();
    
    // 清空类型选择
    setSelectedTypes([]);
    
    setSearchParam(param);
    setPage(1);
    fetchNumbers(1, false, [], param);
  };

  // 修改 fetchNumbers 函数，添加搜索参数参数
  const fetchNumbers = async (
    pageNum: number, 
    isLoadMore: boolean = false,
    typesToUse: string[] = selectedTypes,
    searchParamToUse: string = searchParam
  ) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "/api/numbers", // 使用本地 API 路由
        {
          loadMore: isLoadMore,
          parameter: searchParamToUse,
          typeList: typesToUse, // 使用传入的类型列表
          page: pageNum,
        }
      );
      console.log(response.data.data); // Log the response data t

      const newNumbers = response.data.data.map((item: any) => {
        // 处理预存金额，如果小于等于50则设为50
        const depositAmount = item.lhYcje ? parseInt(item.lhYcje) : 0;
        const finalDeposit = depositAmount <= 50 ? '50' : item.lhYcje || '';
        //处理保底金额
        const monthlyFee = item.lhBdje? parseInt(item.lhBdje) : 0;
        const finalMonthlyFee = monthlyFee <= 59? '59' : item.lhBdje || '';
        //处理合约期
        const contractPeriod = item.lhQyq? parseInt(item.lhQyq) : 0;
        const finalContractPeriod = contractPeriod <= 24? '24' : item.lhQyq || '';

        return {
          number: item.billId || '',  // Provide default empty string if number is missing
          deposit: finalDeposit,
          monthlyFee: finalMonthlyFee,
          contractPeriod: finalContractPeriod,
          islh: item.islh || '',
        };
      });

      if (isLoadMore) {
        setNumbers((prev) => [...prev, ...newNumbers]);
      } else {
        setNumbers(newNumbers);
      }
    } catch (error) {
      console.error("获取号码失败:", error);
    } finally {
      setLoading(false);
    }
  };


// 修改类型点击处理函数
const handleTypeClick = (type: string) => {
  // 先保存新的类型状态
  let newTypes: string[];
  
  // 如果已经选择了该类型，则清空所有选择
  if (selectedTypes.includes(type)) {
    newTypes = [];
  } else {
    // 否则，设置为仅选择该类型
    newTypes = [type];
  }
  
  // 更新状态
  setSelectedTypes(newTypes);
  
  // 清空输入框
  setDigitInputs(Array(11).fill(''));
  setSearchParam('');
  
  // 直接使用新的类型值执行搜索，不使用输入框的值
  setPage(1);
  fetchNumbers(1, false, newTypes, '');
};

  const numberPatterns = [
    { id: "AABB", label: "AABB" },
    { id: "ABC", label: "ABC" },
    { id: "AAAB", label: "AAAB" },
    { id: "ABAB", label: "ABAB" },
    { id: "ABCABC", label: "ABCABC" },
    { id: "爱情号", label: "爱情号" },
    { id: "学霸号", label: "学霸号" },
    { id: "保底59", label: "保底59" },
    { id: "保底99", label: "保底99" },
    { id: "保底199", label: "保底199" },
    { id: "保底299", label: "保底299" },
    { id: "保底399", label: "保底399" },
    { id: "车牌号", label: "车牌号" },
    { id: "三口之家", label: "三口之家" },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-red-50">
      {/* 标题 */}
      <div className="w-full p-4 bg-red-500 text-white text-center font-bold text-2xl mb-4">
        所有号码，免费送，
      </div>
      
      {/* 添加图片和服务信息 */}
      <div className="w-full flex justify-between items-center mb-4 bg-white rounded-lg shadow-md p-4">
        {/* 左侧服务信息 */}
        <div className="flex flex-col justify-center space-y-3 w-1/2 pl-6">
          <div className="text-xl font-bold text-red-500">24小时服务</div>
          <div className="text-lg font-medium">全宁波地区</div>
          <div className="text-lg font-medium">上门开卡服务</div>
          <div className="text-lg font-medium">扫码添加微信咨询</div>
          <div className="text-lg font-medium">15606740674</div>
        </div>
        
        {/* 右侧二维码 */}
        <div className="w-1/2 flex justify-center">
          <img 
            src="/qrcode.jpg" 
            alt="联系二维码" 
            className="w-64 h-64 object-contain rounded-lg"
          />
        </div>
      </div>
      
      {/* 搜索区域 */}
      <div className="w-full p-4 bg-white rounded-lg shadow-sm mb-4 mt-2">
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">请输入您想要的号码</h2>
          
          {/* 数字输入框 */}
          <div className="flex items-center mb-4">
            {Array.from({ length: 11 }, (_, i) => (
              <input
                key={i}
                type="text"
                value={digitInputs[i]}
                onChange={(e) => handleDigitChange(i, e.target.value, e)}
                className="w-8 h-10 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={(i+1).toString()}
                maxLength={1}
              />
            ))}
            
            <button
              onClick={handleSearch}
              className="h-10 bg-red-500 text-white px-2  rounded-lg hover:bg-red-600 transition ml-1 text-xs"
            >
              搜索
            </button>
          </div>

          {/* 号码类型选择 */}
          <div className="flex flex-wrap gap-2">
            {numberPatterns.map((pattern) => (
              <button
                key={pattern.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTypes.includes(pattern.id)
                    ? "bg-red-500 text-white"
                    : "bg-red-100 text-red-500 border border-red-200"
                }`}
                onClick={() => handleTypeClick(pattern.id)}
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 号码列表 */}
      <div className="w-full bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-12 p-4 border-b border-gray-200 font-medium text-gray-700">
          <div className="col-span-5">号码</div>
          <div className="col-span-2">预存</div>
          <div className="col-span-2">保底</div>
          <div className="col-span-3">合约期</div>
        </div>

        {numbers.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="col-span-5 font-medium text-gray-800 flex items-center">
              {item.islh == '1' && (
                <span className="inline-block w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center mr-2">
                  靓
                </span>
              )}
              {item.number}
            </div>
            <div className="col-span-2">{item.deposit}元</div>
            <div className="col-span-2">{item.monthlyFee}元/月</div>
            <div className="col-span-3">{item.contractPeriod}个月</div>
          </div>
        ))}

        {/* 自动加载指示器 */}
        <div 
          ref={loadingRef} 
          className="p-6 text-center text-gray-500 border-t border-gray-200 bg-gray-50"
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mr-2"></div>
              加载中...
            </div>
          ) : (
            <div>上拉加载更多</div>
          )}
        </div>
      </div>
    </main>
  );
}

