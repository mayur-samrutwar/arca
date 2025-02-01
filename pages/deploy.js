import { useState } from 'react';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

// Configuration options remain the same
const AVATAR_OPTIONS = [
  { id: 'felix', name: 'Felix', price: 100, seed: 'Felix' },
  { id: 'john', name: 'John', price: 150, seed: 'John' },
  { id: 'sarah', name: 'Sarah', price: 200, seed: 'Sarah' },
  { id: 'mike', name: 'Mike', price: 250, seed: 'Mike' }
];

const GENDER_OPTIONS = [
  { id: 'male', name: 'Male', price: 0 },
  { id: 'female', name: 'Female', price: 0 }
];

const OCCUPATION_OPTIONS = [
  { id: 'banker', name: 'Banker', price: 500 },
  { id: 'trader', name: 'Trader', price: 400 },
  { id: 'investor', name: 'Investor', price: 600 },
  { id: 'merchant', name: 'Merchant', price: 300 }
];

export default function Deploy() {
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [selectedGender, setSelectedGender] = useState(GENDER_OPTIONS[0]);
  const [selectedOccupation, setSelectedOccupation] = useState(OCCUPATION_OPTIONS[0]);
  const [initialBalance, setInitialBalance] = useState(1000);
  const [totalPrice, setTotalPrice] = useState(
    AVATAR_OPTIONS[0].price + OCCUPATION_OPTIONS[0].price + initialBalance
  );

  const updateTotalPrice = (avatar, occupation) => {
    setTotalPrice(avatar.price + occupation.price + initialBalance);
  };

  const handleBalanceChange = (e) => {
    const newBalance = Number(e.target.value);
    setInitialBalance(newBalance);
    setTotalPrice(selectedAvatar.price + selectedOccupation.price + newBalance);
  };

  useState(() => {
    setTotalPrice(AVATAR_OPTIONS[0].price + OCCUPATION_OPTIONS[0].price + initialBalance);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-normal mb-8">Deploy Agent</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Scrollable Options */}
        <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-4">
          {/* Avatar Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Avatar</h2>
            <div className="grid grid-cols-2 gap-4">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    updateTotalPrice(avatar, selectedOccupation);
                  }}
                  className={`p-4 rounded-lg border ${
                    selectedAvatar.id === avatar.id
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatar.seed}`}
                    alt={avatar.name}
                    className="w-16 h-16 mx-auto mb-2"
                  />
                  <div className="text-sm">{avatar.name}</div>
                  <div className="text-xs text-zinc-500">${avatar.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Gender Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Gender</h2>
            <div className="grid grid-cols-2 gap-4">
              {GENDER_OPTIONS.map((gender) => (
                <button
                  key={gender.id}
                  onClick={() => setSelectedGender(gender)}
                  className={`p-4 rounded-lg border ${
                    selectedGender.id === gender.id
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm">{gender.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Occupation Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Occupation</h2>
            <div className="grid grid-cols-2 gap-4">
              {OCCUPATION_OPTIONS.map((occupation) => (
                <button
                  key={occupation.id}
                  onClick={() => {
                    setSelectedOccupation(occupation);
                    updateTotalPrice(selectedAvatar, occupation);
                  }}
                  className={`p-4 rounded-lg border ${
                    selectedOccupation.id === occupation.id
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm">{occupation.name}</div>
                  <div className="text-xs text-zinc-500">
                    ${occupation.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Balance Input */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Initial Balance</h2>
            <input
              type="number"
              value={initialBalance}
              onChange={handleBalanceChange}
              min="0"
              step="100"
              className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm"
            />
          </div>
        </div>

        {/* Right Column - Fixed Preview */}
        <div className="border border-zinc-200 p-6 rounded-lg sticky top-8 h-fit">
          <h2 className="text-sm font-medium mb-4">Preview</h2>
          <div className="aspect-square relative bg-zinc-50 rounded-lg mb-4">
            <img
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedAvatar.seed}`}
              alt="Selected Avatar"
              className="w-full h-full p-8"
            />
          </div>
          <div className="space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Avatar</span>
              <span>{selectedAvatar.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Gender</span>
              <span>{selectedGender.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Occupation</span>
              <span>{selectedOccupation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Initial Balance</span>
              <span>${initialBalance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Deploy Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-lg p-2 shadow-lg">
        <div className="text-sm font-medium">
          Total Price: <span className="text-zinc-500">
            ${totalPrice} 
          </span>
        </div>
        <button className="bg-black text-white hover:bg-zinc-900 px-6 py-2 rounded-lg transition-colors text-sm font-medium">
          Deploy Agent
        </button>
      </div>
    </div>
  );
}