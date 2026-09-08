import React, { useState } from 'react';
import { SalonSlot, User } from '../types';

interface CalendarViewProps {
  slots: SalonSlot[];
  currentUser: User | null;
  onSelectSlot?: (slot: SalonSlot) => void;
  onSelectSalonSlot?: (slot: SalonSlot) => void;
  myBookedSlotIds?: Set<string>;
  myBookedSalonSlotIds?: Set<string>;
  lastUpdatedSlotId?: string | null;
  lastUpdatedSalonSlotId?: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  slots = [],
  currentUser,
  onSelectSlot,
  onSelectSalonSlot,
  myBookedSlotIds,
  myBookedSalonSlotIds,
  lastUpdatedSlotId,
  lastUpdatedSalonSlotId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const handleSelectSlot = onSelectSlot || onSelectSalonSlot || (() => {});
  const bookedSet = myBookedSlotIds || myBookedSalonSlotIds || new Set<string>();
  
  const filteredSalonSlots = (slots || []).filter(slot => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'hand') return ['gel_art', 'gel_simple', 'paragel_care', 'special_custom'].includes(slot.category);
    if (selectedCategory === 'foot') return slot.category === 'foot_nail';
    if (selectedCategory === 'care') return slot.category === 'care_off';
    return true;
  });

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return { month: '--', day: '--' };
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length >= 3) {
      return {
        month: String(parseInt(parts[1], 10) || parts[1]),
        day: String(parseInt(parts[2], 10) || parts[2]),
      };
    }
    return { month: '', day: dateStr };
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'gel_art': return '定額アート';
      case 'gel_simple': return 'シンプル';
      case 'paragel_care': return 'パラジェル';
      case 'foot_nail': return 'フットネイル';
      case 'special_custom': return '持ち込みデザイン';
      case 'care_off': return 'ケア・オフ';
      default: return category;
    }
  };

  return (
    <div className="container py-5">
        <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
                <span className="badge bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 rounded-pill mb-2 font-bold">24時間Web受付</span>
                <h2 className="fw-bold text-dark mb-3">空き枠カレンダー</h2>
                <p className="text-muted small">
                    ご希望のメニューカテゴリを選択し、空いているお時間をお選びください。<br />
                    〇：空きあり　△：残りわずか　×：満席
                </p>
            </div>
        </div>

        <div className="row justify-content-center mb-4">
            <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 bg-white p-3">
                    <form className="d-flex flex-wrap gap-2 justify-content-center">
                        <button 
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`btn ${selectedCategory === 'all' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-pill px-4 fw-bold shadow-2xs border-0`}
                        >
                            すべて
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedCategory('hand')}
                            className={`btn ${selectedCategory === 'hand' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-pill px-4 fw-bold shadow-2xs border-0`}
                        >
                            <i className="bi bi-stars"></i> Hand
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedCategory('foot')}
                            className={`btn ${selectedCategory === 'foot' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-pill px-4 fw-bold shadow-2xs border-0`}
                        >
                            <i className="bi bi-moon-stars"></i> Foot
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedCategory('care')}
                            className={`btn ${selectedCategory === 'care' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-pill px-4 fw-bold shadow-2xs border-0`}
                        >
                            <i className="bi bi-flower1"></i> Care
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <div className="row">
            {filteredSalonSlots.length > 0 ? filteredSalonSlots.map(slot => {
                const isFull = slot.bookedCount >= slot.capacity;
                const isBooked = bookedSet.has(slot.id);
                const { month, day } = formatDateDisplay(slot.date);
                const startHour = slot.startTime ? slot.startTime.split(':')[0] : '--';
                
                return (
                <div className="col-md-6 col-lg-4 mb-4" key={slot.id}>
                    <div className="card h-100 border-0 shadow-sm rounded-4 hover-lift">
                        <div className="card-body p-4 position-relative">
                            {isBooked && (
                                <div className="position-absolute top-0 end-0 mt-3 me-3">
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small">
                                        <i className="bi bi-check-circle-fill me-1"></i>予約済
                                    </span>
                                </div>
                            )}
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-light text-center rounded-3 p-2 me-3 border" style={{ width: '65px', borderColor: '#e2e8f0 !important' }}>
                                    <div className="small text-muted fw-bold mb-1" style={{ fontSize: '0.75rem' }}>{month}/{day}</div>
                                    <div className="fs-5 fw-bold text-rose-600">{startHour}時</div>
                                </div>
                                <div>
                                    <span className="badge bg-rose-50 text-rose-700 border border-rose-200 mb-1">{getCategoryLabel(slot.category)}</span>
                                    <h4 className="h6 fw-bold mb-0 text-dark">{slot.title}</h4>
                                </div>
                            </div>
                            <div className="text-muted small mb-3">
                                <p className="mb-1"><i className="bi bi-clock me-1"></i>{slot.startTime} - {slot.endTime}</p>
                                <p className="mb-0"><i className="bi bi-person me-1"></i>担当: {slot.hostName}</p>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                <div className="fw-bold text-dark">¥{slot.price.toLocaleString()}</div>
                                <div>
                                    {isBooked ? (
                                        <button className="btn btn-sm btn-outline-success fw-bold rounded-pill px-3" onClick={() => handleSelectSlot(slot)}>詳細を確認</button>
                                    ) : isFull ? (
                                        <button className="btn btn-sm btn-secondary fw-bold rounded-pill px-3 disabled">× 満席</button>
                                    ) : (
                                        <button className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white fw-bold rounded-pill px-3 shadow-sm border-0" onClick={() => handleSelectSlot(slot)}>
                                            〇 予約する
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}) : (
                <div className="col-12 text-center py-5">
                    <div className="mb-3 text-muted">
                        <i className="bi bi-calendar-x" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <p className="text-muted fw-bold">該当する空き枠がありません。</p>
                </div>
            )}
        </div>
        
        <style>{`
            .hover-lift {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .hover-lift:hover {
                transform: translateY(-5px);
                box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
            }
        `}</style>
    </div>
  );
};
