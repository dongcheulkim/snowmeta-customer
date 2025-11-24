import React, { useState, useEffect } from 'react';
import { createService, updateService } from '../services/serviceService';

const ServiceFormModal = ({ customer, service, isOpen, onClose, onServiceUpdated }) => {
  const [formData, setFormData] = useState({
    service_date: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_plate: '',
    service_type: '',
    service_description: '',
    labor_hours: '',
    labor_cost: '',
    parts_cost: '',
    total_cost: '',
    technician_name: '',
    service_status: 'completed',
    payment_status: 'paid',
    notes: '',
    customer_memo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      // 수정 모드
      setFormData({
        service_date: service.service_date ? service.service_date.split('T')[0] : '',
        vehicle_model: service.vehicle_info?.model || '',
        vehicle_year: service.vehicle_info?.year || '',
        vehicle_plate: service.vehicle_info?.plate || '',
        service_type: service.service_type || '',
        service_description: service.service_description || '',
        labor_hours: service.labor_hours || '',
        labor_cost: service.labor_cost || '',
        parts_cost: service.parts_cost || '',
        total_cost: service.total_cost || '',
        technician_name: service.technician_name || '',
        service_status: service.service_status || 'completed',
        payment_status: service.payment_status || 'paid',
        notes: service.notes || '',
        customer_memo: service.customer_memo || ''
      });
    } else {
      // 새로 추가 모드
      setFormData({
        service_date: new Date().toISOString().split('T')[0],
        vehicle_model: '',
        vehicle_year: '',
        vehicle_plate: '',
        service_type: '',
        service_description: '',
        labor_hours: '',
        labor_cost: '',
        parts_cost: '',
        total_cost: '',
        technician_name: '',
        service_status: 'completed',
        payment_status: 'paid',
        notes: '',
        customer_memo: ''
      });
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 자동 총비용 계산
    if (name === 'labor_cost' || name === 'parts_cost') {
      const laborCost = name === 'labor_cost' ? parseInt(value) || 0 : parseInt(formData.labor_cost) || 0;
      const partsCost = name === 'parts_cost' ? parseInt(value) || 0 : parseInt(formData.parts_cost) || 0;
      setFormData(prev => ({
        ...prev,
        total_cost: laborCost + partsCost
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const serviceData = {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        service_date: formData.service_date,
        vehicle_info: JSON.stringify({
          model: formData.vehicle_model,
          year: parseInt(formData.vehicle_year) || null,
          plate: formData.vehicle_plate
        }),
        service_type: formData.service_type,
        service_description: formData.service_description,
        parts_used: [],
        labor_hours: parseFloat(formData.labor_hours) || 0,
        labor_cost: parseInt(formData.labor_cost) || 0,
        parts_cost: parseInt(formData.parts_cost) || 0,
        total_cost: parseInt(formData.total_cost) || 0,
        technician_name: formData.technician_name,
        service_status: formData.service_status,
        payment_status: formData.payment_status,
        branch: '곤지암',
        notes: formData.notes,
        customer_memo: formData.customer_memo
      };

      if (service) {
        await updateService(service.id, serviceData);
      } else {
        await createService(serviceData);
      }

      onServiceUpdated();
      onClose();
      
      // Success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-900 border border-green-700 text-green-100 px-6 py-4 rounded-lg shadow-ski-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          서비스업무가 성공적으로 ${service ? '수정' : '등록'}되었습니다
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
      
    } catch (error) {      alert(`서비스업무 ${service ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-snow-900 border border-snow-700 rounded-xl shadow-ski-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-black border-b border-snow-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              {service ? '서비스업무 수정' : '새 서비스업무 등록'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-snow-400 hover:text-white p-2 rounded-lg hover:bg-snow-800 transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Customer Info */}
        <div className="bg-snow-800 border-b border-snow-700 px-6 py-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-10 w-10 bg-gradient-to-br from-white to-snow-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-black">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-white font-semibold">{customer.name}</div>
              <div className="text-snow-300 text-sm">{customer.phone}</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-snow-400 mb-1">
              메모
            </label>
            <input
              type="text"
              name="customer_memo"
              value={formData.customer_memo}
              onChange={handleChange}
              placeholder="예: 25-26 엠버서더"
              className="w-full px-3 py-2 bg-snow-700 border border-snow-600 rounded-md text-white placeholder-snow-400 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="service_date" className="block text-sm font-semibold text-snow-300 mb-2">
                서비스일자 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="service_date"
                name="service_date"
                value={formData.service_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
              />
            </div>

            <div>
              <label htmlFor="service_type" className="block text-sm font-semibold text-snow-300 mb-2">
                서비스유형 <span className="text-red-400">*</span>
              </label>
              <select
                id="service_type"
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
              >
                <option value="">서비스유형 선택</option>
                <option value="일반정비">일반정비</option>
                <option value="오일교환">오일교환</option>
                <option value="타이어교체">타이어교체</option>
                <option value="브레이크패드교체">브레이크패드교체</option>
                <option value="에어컨정비">에어컨정비</option>
                <option value="배터리교체">배터리교체</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          {/* 차량 정보 */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-snow-700 pb-2">차량정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="vehicle_model" className="block text-sm font-semibold text-snow-300 mb-2">
                  차량모델
                </label>
                <input
                  type="text"
                  id="vehicle_model"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleChange}
                  placeholder="예: 아반떼"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>

              <div>
                <label htmlFor="vehicle_year" className="block text-sm font-semibold text-snow-300 mb-2">
                  연식
                </label>
                <input
                  type="number"
                  id="vehicle_year"
                  name="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={handleChange}
                  placeholder="2020"
                  min="1990"
                  max="2030"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>

              <div>
                <label htmlFor="vehicle_plate" className="block text-sm font-semibold text-snow-300 mb-2">
                  번호판
                </label>
                <input
                  type="text"
                  id="vehicle_plate"
                  name="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={handleChange}
                  placeholder="12가3456"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>
            </div>
          </div>

          {/* 서비스 상세 내용 */}
          <div>
            <label htmlFor="service_description" className="block text-sm font-semibold text-snow-300 mb-2">
              서비스 상세 내용
            </label>
            <textarea
              id="service_description"
              name="service_description"
              value={formData.service_description}
              onChange={handleChange}
              rows="3"
              placeholder="서비스 작업 내용을 상세히 입력하세요"
              className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150 resize-none"
            />
          </div>

          {/* 비용 정보 */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-snow-700 pb-2">비용정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="labor_hours" className="block text-sm font-semibold text-snow-300 mb-2">
                  작업시간
                </label>
                <input
                  type="number"
                  id="labor_hours"
                  name="labor_hours"
                  value={formData.labor_hours}
                  onChange={handleChange}
                  placeholder="2.5"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>

              <div>
                <label htmlFor="technician_name" className="block text-sm font-semibold text-snow-300 mb-2">
                  담당 기술자
                </label>
                <input
                  type="text"
                  id="technician_name"
                  name="technician_name"
                  value={formData.technician_name}
                  onChange={handleChange}
                  placeholder="박정수"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>

              <div>
                <label htmlFor="labor_cost" className="block text-sm font-semibold text-snow-300 mb-2">
                  공임비
                </label>
                <input
                  type="number"
                  id="labor_cost"
                  name="labor_cost"
                  value={formData.labor_cost}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>

              <div>
                <label htmlFor="parts_cost" className="block text-sm font-semibold text-snow-300 mb-2">
                  부품비
                </label>
                <input
                  type="number"
                  id="parts_cost"
                  name="parts_cost"
                  value={formData.parts_cost}
                  onChange={handleChange}
                  placeholder="30000"
                  min="0"
                  className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
                />
              </div>
            </div>

            <div>
              <label htmlFor="total_cost" className="block text-sm font-semibold text-snow-300 mb-2">
                총 비용 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="total_cost"
                name="total_cost"
                value={formData.total_cost}
                onChange={handleChange}
                required
                placeholder="80000"
                min="0"
                className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
              />
            </div>
          </div>

          {/* 상태 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="service_status" className="block text-sm font-semibold text-snow-300 mb-2">
                서비스 상태
              </label>
              <select
                id="service_status"
                name="service_status"
                value={formData.service_status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
              >
                <option value="completed">완료</option>
                <option value="in_progress">진행중</option>
                <option value="scheduled">예약됨</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment_status" className="block text-sm font-semibold text-snow-300 mb-2">
                결제 상태
              </label>
              <select
                id="payment_status"
                name="payment_status"
                value={formData.payment_status}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange(e);

                  // 쿠폰 선택 시 자동으로 금액 적용
                  if (value === 'coupon_free') {
                    setFormData(prev => ({
                      ...prev,
                      payment_status: value,
                      total_cost: 0
                    }));
                  } else if (value === 'coupon_discount') {
                    const currentTotal = parseInt(formData.total_cost) || 0;
                    const discountedAmount = Math.round(currentTotal * 0.7); // 30% 할인
                    setFormData(prev => ({
                      ...prev,
                      payment_status: value,
                      total_cost: discountedAmount
                    }));
                  }
                }}
                className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150"
              >
                <option value="paid">결제완료</option>
                <option value="pending">결제대기</option>
                <option value="coupon_free">1회 쿠폰</option>
                <option value="coupon_discount">30% 할인 쿠폰</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>
          </div>

          {/* 비고 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-snow-300 mb-2">
              비고
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="추가 메모나 특이사항을 입력하세요"
              className="w-full px-4 py-3 bg-snow-800 border border-snow-600 rounded-lg text-white placeholder-snow-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors duration-150 resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4 border-t border-snow-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-snow-700 hover:bg-snow-600 text-snow-200 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-snow-500 focus:ring-offset-2 focus:ring-offset-snow-900 transition-colors duration-150"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-white hover:bg-snow-100 text-black font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-snow-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  {service ? '수정 중..' : '등록 중..'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {service ? '수정 완료' : '등록 완료'}
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-snow-500 text-center">
            <span className="text-red-400">*</span> 표시된 필수 입력 항목입니다
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormModal;
