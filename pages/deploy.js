import { useState } from 'react';
import { Geist } from 'next/font/google';
import { createAgent } from '../schemas/agent';
import { generateETHKeys } from '../utils/generate-key';

const geist = Geist({ subsets: ['latin'] });

// Configuration options
const AVATAR_OPTIONS = [
  { id: 'felix', seed: 'Felix', price: 100 },
  { id: 'john', seed: 'John', price: 150 },
  { id: 'sarah', seed: 'Sarah', price: 200 },
  { id: 'mike', seed: 'Mike', price: 250 }
];

const GENDER_OPTIONS = [
  { id: 'male', name: 'Male', price: 0 },
  { id: 'female', name: 'Female', price: 0 }
];

const OCCUPATION_OPTIONS = [
  { id: 'researcher', name: 'Researcher', price: 500 },
  { id: 'banker', name: 'Banker', price: 400 },
  { id: 'judge', name: 'Judge', price: 600 },
  { id: 'council', name: 'Council', price: 700 },
  { id: 'unemployed', name: 'Unemployed', price: 100 }
];

export default function Deploy() {
  const [name, setName] = useState('');
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

  const handleDeploy = () => {
    const keys = generateETHKeys();

    const agentParams = {
      name: name,
      gender: selectedGender.id,
      occupation: selectedOccupation.id,
      public_key: keys.address,
      private_key: keys.privateKey,
      initial_balance: initialBalance,
    };

    try {
      const newAgent = createAgent(agentParams);
      console.log('New Agent Created:', {
        ...newAgent,
      });
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  useState(() => {
    setTotalPrice(AVATAR_OPTIONS[0].price + OCCUPATION_OPTIONS[0].price + initialBalance);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-normal mb-8">Deploy Agent</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-4">
          {/* Name Input */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
              className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          {/* Avatar Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Avatar</h2>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    updateTotalPrice(avatar, selectedOccupation);
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    selectedAvatar.id === avatar.id
                      ? 'border-black shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatar.seed}`}
                    alt={`Avatar ${avatar.id}`}
                    className="w-12 h-12 mx-auto"
                  />
                  <div className="text-xs text-zinc-500 mt-1">{avatar.price} $ARCA</div>
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
                  className={`p-4 rounded-lg transition-all ${
                    selectedGender.id === gender.id
                      ? 'border border-black  shadow-sm'
                      : 'border border-zinc-200 hover:border-zinc-300'
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
                      ? 'border-black'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm">{occupation.name}</div>
                  <div className="text-xs text-zinc-500">
                    {occupation.price} $ARCA
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

        {/* Preview panel - Update to show name */}
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
              <span className="text-zinc-500">Name</span>
              <span>{name || 'Unnamed Agent'}</span>
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
              <span>{initialBalance} $ARCA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Deploy Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-lg p-2 shadow-lg">
        <div className="text-sm font-medium">
          Total Price: <span className="text-zinc-500">
            {totalPrice} $ARCA
          </span>
        </div>
        <button 
          onClick={handleDeploy}
          className="bg-black text-white hover:bg-zinc-900 px-6 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Deploy Agent
        </button>
      </div>
    </div>
  );
}