import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navbar, ActiveTabType } from './components/Navbar';
import { Footer } from './components/Footer';
import { CalendarView } from './components/CalendarView';
import { BookingModal } from './components/BookingModal';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { HomePage } from './components/HomePage';
import { SalonGuideView } from './components/SalonGuideView';
import { BookingConfirmationView } from './components/BookingConfirmationView';
import { SalonAccessView } from './components/SalonAccessView';
import { MemberProfileView } from './components/MemberProfileView';
import { AuthModal } from './components/AuthModal';
import { HostManagementView } from './components/HostManagementView';
import { RealtimeToast } from './components/RealtimeToast';
import {
  INITIAL_USERS,
  generateInitialSlots,
  INITIAL_RESERVATIONS,
  SALON_INFO,
} from './data/mockData';
import { SalonSlot, User, Reservation, RealtimeNotification } from './types';

export default function App() {
  // State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(INITIAL_USERS[0].id);
  const [slots, setSlots] = useState<SalonSlot[]>(generateInitialSlots);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [activeTab, setActiveTab] = useState<ActiveTabType>('home');

  // Modal states
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<SalonSlot | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{ offRequired: boolean; nailRequests?: string }>({
    offRequired: false,
  });
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false);
  const [stripeAmount, setStripeAmount] = useState<number>(0);

  // Auth modal states
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register' | 'logout';
  }>({
    isOpen: false,
    mode: 'login',
  });

  // Real-time notifications & highlighting
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [lastUpdatedSlotId, setLastUpdatedSlotId] = useState<string | undefined>();
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  // Helper to add toast notification
  const addNotification = (
    type: 'booking' | 'cancellation' | 'slot_created' | 'slot_updated',
    message: string,
    slotId?: string
  ) => {
    const newNotif: RealtimeNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      slotId,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    if (slotId) {
      setLastUpdatedSlotId(slotId);
      setTimeout(() => setLastUpdatedSlotId(undefined), 3000);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Set of slot IDs booked by current user
  const myBookedSlotIds = new Set(
    reservations
      .filter((r) => r.userId === currentUser.id && r.status === 'confirmed')
      .map((r) => r.slotId)
  );

  // Switch user role (Member / VIP / Host)
  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      addNotification(
        'slot_updated',
        `「${targetUser.name} (${targetUser.role === 'host' ? 'オーナー' : targetUser.tier === 'vip' ? 'VIP優待' : '一般'})」でログインしました`
      );
    }
  };

  // Handle Login from AuthModal
  const handleLogin = (user: User) => {
    if (!users.some((u) => u.id === user.id)) {
      setUsers((prev) => [...prev, user]);
    }
    setCurrentUserId(user.id);
    addNotification('slot_updated', `おかえりなさいませ、${user.name} 様（Django LoginView認証完了）`);
  };

  // Handle Register from AuthModal
  const handleRegister = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    addNotification('slot_updated', `新規会員登録が完了しました。${newUser.name} 様、ようこそClaireへ！`);
  };

  // Handle Logout
  const handleLogout = () => {
    // Switch to first standard user or guest
    const guestUser = users.find((u) => u.role === 'member') || users[0];
    setCurrentUserId(guestUser.id);
    addNotification('slot_updated', 'ログアウトしました（Django LogoutView実行）');
    setActiveTab('home');
  };

  // Update Member Profile
  const handleUpdateProfile = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    addNotification('slot_updated', '会員プロフィールおよびネイルカルテを更新保存しました');
  };

  // Delete Member Account
  const handleDeleteAccount = (userId: string) => {
    // Auto-cancel any active reservations for this user
    setReservations((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, status: 'cancelled' } : r))
    );

    // Remove user from users list
    const remainingUsers = users.filter((u) => u.id !== userId);
    setUsers(remainingUsers);

    // Fallback to remaining user
    if (remainingUsers.length > 0) {
      setCurrentUserId(remainingUsers[0].id);
    }

    addNotification('cancellation', '会員登録およびネイルカルテ情報の削除（退会処理）が完了しました');
    setActiveTab('home');
  };

  // Handle proceed to Stripe
  const handleProceedToStripe = (
    slot: SalonSlot,
    effectivePrice: number,
    details?: { offRequired: boolean; nailRequests?: string }
  ) => {
    if (details) {
      setBookingDetails(details);
    }

    setStripeAmount(effectivePrice);
    setShowStripeModal(true);
  };

  // On Stripe payment successful
  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (!selectedSlotForBooking) return;

    const slot = selectedSlotForBooking;
    const newReservationId = `res_${Date.now().toString(36)}`;
    const newReservation: Reservation = {
      id: newReservationId,
      slotId: slot.id,
      slotTitle: slot.title,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      category: slot.category,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      createdAt: new Date().toLocaleString('ja-JP'),
      status: 'confirmed',
      amount: stripeAmount,
      stripePaymentIntentId: paymentIntentId,
      receiptUrl: `https://stripe.com/receipt/${paymentIntentId}`,
      meetingUrl: slot.meetingUrl || '自由が丘店 完全個室ブース',
      offRequired: bookingDetails.offRequired,
      nailRequests: bookingDetails.nailRequests,
    };

    setReservations((prev) => [newReservation, ...prev]);
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slot.id) {
          const nextCount = s.bookedCount + 1;
          return {
            ...s,
            bookedCount: nextCount,
            status: nextCount >= s.capacity ? 'full' : 'available',
            bookedUserIds: [...s.bookedUserIds, currentUser.id],
          };
        }
        return s;
      })
    );

    setShowStripeModal(false);
    setSelectedSlotForBooking(null);
    addNotification('booking', `【予約・決済完了】「${slot.title}」のご予約を承りました (¥${stripeAmount.toLocaleString()})`, slot.id);
    setActiveTab('booking_confirm');
  };

  // Cancel reservation
  const handleCancelReservation = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
    );

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === res.slotId) {
          const nextCount = Math.max(0, s.bookedCount - 1);
          return {
            ...s,
            bookedCount: nextCount,
            status: 'available',
            bookedUserIds: s.bookedUserIds.filter((uid) => uid !== res.userId),
          };
        }
        return s;
      })
    );

    addNotification(
      'cancellation',
      `予約番号: ${res.id} をキャンセルしました。Stripe事前決済分は全額自動返金処理が行われました。`,
      res.slotId
    );
  };

  // Host creates new slot
  const handleCreateSlot = (newSlotData: Omit<SalonSlot, 'id' | 'bookedCount' | 'bookedUserIds'>) => {
    const newSlot: SalonSlot = {
      ...newSlotData,
      id: `slot_${Date.now()}`,
      bookedCount: 0,
      bookedUserIds: [],
    };

    setSlots((prev) => [newSlot, ...prev]);
    addNotification('slot_created', `新着枠「${newSlot.title}」が公開されました (WebSocket配信)`, newSlot.id);
  };

  // Host toggles slot status (open/close)
  const handleToggleSlotStatus = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          const nextStatus = s.status === 'closed' ? (s.bookedCount >= s.capacity ? 'full' : 'available') : 'closed';
          addNotification('slot_updated', `施術枠「${s.title}」のステータスを ${nextStatus === 'closed' ? '受付停止' : '受付中'} に更新しました`, slotId);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  // Host deletes slot
  const handleDeleteSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    addNotification('slot_updated', '施術枠を削除しました');
  };

  // Multi-user concurrent booking simulation
  const handleSimulateConcurrentBooking = () => {
    setIsSimulating(true);

    // Pick an available slot
    const availableSlots = slots.filter((s) => s.status === 'available' && s.bookedCount < s.capacity);
    if (availableSlots.length === 0) {
      addNotification('slot_updated', '現在空き枠がありません。');
      setIsSimulating(false);
      return;
    }

    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    const mockNames = ['中村 結衣', '松本 陽葵', '佐々木 遥', '高橋 奈々'];
    const randomMember = mockNames[Math.floor(Math.random() * mockNames.length)];

    setTimeout(() => {
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id === randomSlot.id) {
            const nextCount = s.bookedCount + 1;
            const isNowFull = nextCount >= s.capacity;
            return {
              ...s,
              bookedCount: nextCount,
              status: isNowFull ? 'full' : 'available',
            };
          }
          return s;
        })
      );

      addNotification(
        'booking',
        `⚡【他端末からの同時予約】${randomMember} 様が「${randomSlot.title}」をWeb即時予約しました`,
        randomSlot.id
      );

      setIsSimulating(false);
    }, 600);
  };

  // Active reservation count for badge
  const activeReservationCount = reservations.filter(
    (r) => r.userId === currentUser.id && r.status === 'confirmed'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* 1. Continuous Top Header (_header.html) */}
      <Header
        currentUser={currentUser}
        onOpenLoginModal={() => setAuthModalState({ isOpen: true, mode: 'login' })}
        onOpenLogoutModal={() => setAuthModalState({ isOpen: true, mode: 'logout' })}
        onNavigateToProfile={() => setActiveTab('profile')}
      />

      {/* 2. Continuous Navbar (_navbar.html) */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        users={users}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reservationCount={activeReservationCount}
        onSimulateConcurrentBooking={handleSimulateConcurrentBooking}
        isSimulating={isSimulating}
        onOpenLoginModal={() => setAuthModalState({ isOpen: true, mode: 'login' })}
        onOpenLogoutModal={() => setAuthModalState({ isOpen: true, mode: 'logout' })}
      />

      {/* Main Content Area */}
      <main className="flex-grow-1 pb-5">
        {activeTab === 'home' && (
          <HomePage
            onGoToCalendar={() => setActiveTab('calendar')}
            onGoToAccess={() => setActiveTab('access')}
            onGoToBookingConfirm={() => setActiveTab('booking_confirm')}
            onGoToProfile={() => setActiveTab('profile')}
            onNavigateToBooking={() => setActiveTab('calendar')}
            onNavigateToAccess={() => setActiveTab('access')}
            onNavigateToGuide={() => setActiveTab('guide')}
            onSelectDesignBooking={(category, designTitle) => {
              const matchingSlot = slots.find(
                (s) => s.category === category && s.status === 'available' && s.bookedCount < s.capacity
              );
              if (matchingSlot) {
                setSelectedSlotForBooking(matchingSlot);
                setBookingDetails({
                  offRequired: false,
                  nailRequests: `【ご希望デザイン】${designTitle}`,
                });
              } else {
                setActiveTab('calendar');
              }
            }}
            currentUser={currentUser}
            salonInfo={SALON_INFO}
            onOpenLoginModal={() => setAuthModalState({ isOpen: true, mode: 'login' })}
          />
        )}

        {activeTab === 'guide' && (
          <SalonGuideView
            onNavigateToBooking={() => setActiveTab('calendar')}
            onNavigateToAccess={() => setActiveTab('access')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            slots={slots}
            currentUser={currentUser}
            onSelectSlot={(slot) => setSelectedSlotForBooking(slot)}
            myBookedSlotIds={myBookedSlotIds}
            lastUpdatedSlotId={lastUpdatedSlotId}
          />
        )}

        {activeTab === 'booking_confirm' && (
          <BookingConfirmationView
            reservations={reservations.filter((r) => r.userId === currentUser.id)}
            currentUser={currentUser}
            onCancelReservation={handleCancelReservation}
            onGoToCalendar={() => setActiveTab('calendar')}
            salonInfo={SALON_INFO}
          />
        )}

        {activeTab === 'access' && (
          <SalonAccessView
            salonInfo={SALON_INFO}
            onGoToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'profile' && (
          <MemberProfileView
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onDeleteAccount={handleDeleteAccount}
            onOpenLoginModal={() => setAuthModalState({ isOpen: true, mode: 'login' })}
          />
        )}

        {activeTab === 'host_admin' && (
          <HostManagementView
            slots={slots}
            reservations={reservations}
            currentUser={currentUser}
            onCreateSlot={handleCreateSlot}
            onToggleSlotStatus={handleToggleSlotStatus}
            onDeleteSlot={handleDeleteSlot}
          />
        )}
      </main>

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          slot={selectedSlotForBooking}
          currentUser={currentUser}
          onClose={() => setSelectedSlotForBooking(null)}
          onProceedToStripe={handleProceedToStripe}
          existingReservation={reservations.find(
            (r) => r.slotId === selectedSlotForBooking.id && r.userId === currentUser.id && r.status === 'confirmed'
          )}
          onCancelReservation={handleCancelReservation}
        />
      )}

      {/* Stripe Checkout Modal */}
      {showStripeModal && selectedSlotForBooking && (
        <StripeCheckoutModal
          slot={selectedSlotForBooking}
          amount={stripeAmount}
          currentUser={currentUser}
          onClose={() => setShowStripeModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Auth Modal (Login / Register / Logout) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        mode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
        currentUser={currentUser}
        availableUsers={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onSwitchMode={(mode) => setAuthModalState((prev) => ({ ...prev, mode }))}
      />

      {/* Real-time Toast Notifications */}
      <RealtimeToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* 5. Continuous Footer (footer.html) */}
      <Footer onNavigate={(tab) => setActiveTab(tab)} />
    </div>
  );
}
