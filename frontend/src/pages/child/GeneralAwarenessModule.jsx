import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WhoAmIGame from '../../games/WhoAmIGame.jsx'

// Speech synthesis helper
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    window.speechSynthesis.speak(utterance)
  }
}

// ─── 12 General Awareness Categories & Items Data ──────────────────────────
export const AWARENESS_CATEGORIES = [
  {
    id: 'animals',
    title: 'Animals',
    emoji: '🐾',
    color: '#FF6B6B',
    bg: 'rgba(255, 107, 107, 0.12)',
    description: 'Discover wild, farm, and domestic animals!',
    items: [
      { name: 'Lion', emoji: '🦁', sound: 'Roar!', fact: 'Lions are known as the King of the Jungle and live in groups called prides.', role: 'Jungle' },
      { name: 'Elephant', emoji: '🐘', sound: 'Trumpet!', fact: 'Elephants are the largest land animals and use trunks to drink and spray water.', role: 'Savannah' },
      { name: 'Dog', emoji: '🐶', sound: 'Woof!', fact: 'Dogs are loyal companions known for their great sense of smell and friendliness.', role: 'Pet' },
      { name: 'Cat', emoji: '🐱', sound: 'Meow!', fact: 'Cats can jump up to 6 times their height and love sleeping in sunbeams.', role: 'Pet' },
      { name: 'Bear', emoji: '🐻', sound: 'Grrr!', fact: 'Bears have thick fur coats and sleep through winter in caves during hibernation.', role: 'Forest' },
      { name: 'Dolphin', emoji: '🐬', sound: 'Click-click!', fact: 'Dolphins are super smart sea mammals that communicate using whistles and clicks.', role: 'Ocean' },
      { name: 'Kangaroo', emoji: '🦘', sound: 'Boing!', fact: 'Kangaroos hop around on strong hind legs and carry babies in a front pouch!', role: 'Australia' },
      { name: 'Cow', emoji: '🐄', sound: 'Moo!', fact: 'Cows give us fresh nutritious milk and spend up to 8 hours a day chewing grass.', role: 'Farm' },
    ]
  },
  {
    id: 'birds',
    title: 'Birds',
    emoji: '🦜',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    description: 'Fly high with colorful birds around the world!',
    items: [
      { name: 'Peacock', emoji: '🦚', sound: 'Chirp!', fact: 'Peacocks spread magnificent green and blue fan-shaped feathers during rain.', role: 'Feather Fan' },
      { name: 'Penguin', emoji: '🐧', sound: 'Honk!', fact: 'Penguins are tuxedo birds that swim fast in icy waters but cannot fly.', role: 'Polar' },
      { name: 'Owl', emoji: '🦉', sound: 'Hoot!', fact: 'Owls can turn their heads almost all the way around and hunt silently at night.', role: 'Night Bird' },
      { name: 'Parrot', emoji: '🦜', sound: 'Squawk!', fact: 'Parrots have colorful feathers and can learn to imitate human words!', role: 'Tropical' },
      { name: 'Flamingo', emoji: '🦩', sound: 'Honk!', fact: 'Flamingos get their pink color from eating tiny shrimps and algae in water.', role: 'Wading Bird' },
      { name: 'Eagle', emoji: '🦅', sound: 'Screech!', fact: 'Eagles have sharp eyesight and fly super high above mountain peaks.', role: 'Sky Hunter' },
    ]
  },
  {
    id: 'plants',
    title: 'Plants',
    emoji: '🌿',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Explore trees, flowers, and greenery!',
    items: [
      { name: 'Sunflower', emoji: '🌻', fact: 'Sunflowers follow the sun across the sky from east to west every day!', role: 'Flower' },
      { name: 'Oak Tree', emoji: '🌳', fact: 'Oak trees can live for hundreds of years and produce tiny acorns.', role: 'Forest Giant' },
      { name: 'Rose', emoji: '🌹', fact: 'Roses smell sweet and come in red, pink, yellow, and white colors.', role: 'Garden Flower' },
      { name: 'Cactus', emoji: '🌵', fact: 'Cactus plants store water in thick stems and grow sharp spines to survive in deserts.', role: 'Desert' },
      { name: 'Bamboo', emoji: '🎍', fact: 'Bamboo is the fastest growing plant on Earth and is eaten by giant pandas!', role: 'Fast Grower' },
      { name: 'Lotus', emoji: '🪷', fact: 'Lotus flowers float cleanly on water ponds and bloom under morning sunshine.', role: 'Water Flower' },
    ]
  },
  {
    id: 'food',
    title: 'Food',
    emoji: '🍎',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    description: 'Healthy and delicious food for energy!',
    items: [
      { name: 'Apple', emoji: '🍎', fact: 'An apple a day keeps the doctor away! Apples are crunchy and full of vitamins.', role: 'Fruit' },
      { name: 'Pizza', emoji: '🍕', fact: 'Pizza originated in Italy and is made with baked crust, cheese, and tomatoes.', role: 'Yummy Treat' },
      { name: 'Bread', emoji: '🍞', fact: 'Bread is made by baking wheat flour dough and is eaten around the world.', role: 'Staple Food' },
      { name: 'Milk', emoji: '🥛', fact: 'Milk is packed with calcium to build strong bones and healthy teeth.', role: 'Dairy Drink' },
      { name: 'Soup', emoji: '🥣', fact: 'Warm vegetable soup keeps you cozy and healthy during chilly winter days.', role: 'Comfort Food' },
      { name: 'Rice', emoji: '🍚', fact: 'Rice is a staple grain enjoyed by over half of the world every day.', role: 'Grain' },
    ]
  },
  {
    id: 'vehicles',
    title: 'Vehicles',
    emoji: '🚒',
    color: '#00CEC9',
    bg: 'rgba(0, 206, 201, 0.12)',
    description: 'Modes of transport on land, water, and sky!',
    items: [
      { name: 'Fire Truck', emoji: '🚒', sound: 'Wee-woo!', fact: 'Fire trucks carry firefighters, water hoses, and long ladders to put out fires.', role: 'Rescue' },
      { name: 'Airplane', emoji: '✈️', sound: 'Whoosh!', fact: 'Airplanes fly above the clouds powered by jet engines to carry travelers.', role: 'Sky' },
      { name: 'School Bus', emoji: '🚌', sound: 'Beep beep!', fact: 'School buses pick up children every morning and take them safely to school.', role: 'Transit' },
      { name: 'Train', emoji: '🚂', sound: 'Choo-choo!', fact: 'Trains travel on iron railway tracks and carry passengers and cargo across cities.', role: 'Rail' },
      { name: 'Bicycle', emoji: '🚲', sound: 'Ring ring!', fact: 'Riding a bicycle is eco-friendly, keeps your legs strong, and builds balance.', role: 'Pedal Bike' },
      { name: 'Rocket', emoji: '🚀', sound: 'Blastoff!', fact: 'Rockets shoot into outer space at high speed to explore the moon and stars!', role: 'Space' },
    ]
  },
  {
    id: 'weather',
    title: 'Weather',
    emoji: '☀️',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    description: 'Sun, rain, clouds, snow, and rainbows!',
    items: [
      { name: 'Sunny', emoji: '☀️', fact: 'Sunny weather gives us bright light and warm solar energy to play outside!', role: 'Daylight' },
      { name: 'Rainy', emoji: '🌧️', fact: 'Rain fills rivers, waters trees and crops, and helps plants grow big.', role: 'Water Drops' },
      { name: 'Snowy', emoji: '❄️', fact: 'Snowflakes fall softly from cold winter clouds to form a white blanket.', role: 'Cold Frost' },
      { name: 'Windy', emoji: '🌬️', fact: 'Wind is moving air that turns wind turbines, flies kites, and rustles leaves.', role: 'Breeze' },
      { name: 'Rainbow', emoji: '🌈', fact: 'Rainbows appear when sunlight shines through raindrops in the sky.', role: '7 Colors' },
      { name: 'Stormy', emoji: '🌩️', fact: 'Storms bring dark thunderclouds, flashing lightning, and heavy raindrops.', role: 'Thunder' },
    ]
  },
  {
    id: 'seasons',
    title: 'Seasons',
    emoji: '🍂',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    description: 'Spring, Summer, Autumn, and Winter!',
    items: [
      { name: 'Spring', emoji: '🌸', fact: 'Spring brings fresh green leaves, blooming flowers, and baby animals!', role: 'Blossom' },
      { name: 'Summer', emoji: '🏖️', fact: 'Summer has long sunny days, warm weather, beach visits, and ice creams.', role: 'Warm Sun' },
      { name: 'Autumn / Fall', emoji: '🍂', fact: 'In autumn, tree leaves change color to orange and brown before falling.', role: 'Falling Leaves' },
      { name: 'Winter', emoji: '❄️', fact: 'Winter is the coldest season when snow falls and we wear cozy sweaters.', role: 'Snowy Frost' },
    ]
  },
  {
    id: 'helpers',
    title: 'Community Helpers',
    emoji: '👨‍🚒',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    description: 'People who help us every day in society!',
    items: [
      { name: 'Firefighter', emoji: '👨‍🚒', fact: 'Firefighters put out dangerous fires and rescue people and pets in trouble.', role: 'Puts out fires' },
      { name: 'Chef', emoji: '👨‍🍳', fact: 'Chefs prepare delicious, healthy meals in restaurant kitchens.', role: 'Cooks food' },
      { name: 'Doctor', emoji: '👨‍⚕️', fact: 'Doctors check your health, give medicine, and cure illnesses.', role: 'Heals sick' },
      { name: 'Teacher', emoji: '👩‍🏫', fact: 'Teachers inspire students, share knowledge, and teach how to read and write.', role: 'Teaches class' },
      { name: 'Police Officer', emoji: '👮‍♂️', fact: 'Police officers enforce laws, direct traffic, and keep citizens safe.', role: 'Keeps safety' },
      { name: 'Farmer', emoji: '👨‍🌾', fact: 'Farmers grow fresh fruits, vegetables, grains, and take care of farm animals.', role: 'Grows food' },
      { name: 'Mail Carrier', emoji: '🧑‍📬', fact: 'Mail carriers deliver letters, packages, and greeting cards to homes.', role: 'Delivers mail' },
      { name: 'Pilot', emoji: '🧑‍✈️', fact: 'Pilots navigate airplanes safely through the sky to distant cities.', role: 'Flies planes' },
    ]
  },
  {
    id: 'body_parts',
    title: 'Body Parts',
    emoji: '👁️',
    color: '#6C5CE7',
    bg: 'rgba(108, 93, 231, 0.12)',
    description: 'Learn how your amazing body works!',
    items: [
      { name: 'Eyes', emoji: '👁️', fact: 'Your eyes take pictures of the world and send them to your brain so you can see!', role: 'Sight' },
      { name: 'Ears', emoji: '👂', fact: 'Ears capture sound waves so you can hear music, voices, and bird songs.', role: 'Hearing' },
      { name: 'Nose', emoji: '👃', fact: 'Your nose helps you smell flowers or baking cookies and breathes fresh air.', role: 'Smell' },
      { name: 'Hands', emoji: '🖐️', fact: 'Hands have fingers and thumbs to write, draw, hold toys, and clap!', role: 'Touch & Hold' },
      { name: 'Legs', emoji: '🦵', fact: 'Strong legs and knees let you walk, run, jump, and dance around!', role: 'Movement' },
      { name: 'Heart', emoji: '❤️', fact: 'Your heart beats nonstop inside your chest to pump blood all through your body.', role: 'Life Pump' },
      { name: 'Brain', emoji: '🧠', fact: 'Your brain is the control center that thinks, remembers, and feels emotions.', role: 'Control Center' },
    ]
  },
  {
    id: 'family',
    title: 'Family',
    emoji: '👨‍👩‍👧',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    description: 'Lovington family members who care for you!',
    items: [
      { name: 'Mother', emoji: '👩', fact: 'Mothers love and care for their children with warm hugs and guidance.', role: 'Mom' },
      { name: 'Father', emoji: '👨', fact: 'Fathers support, protect, and play fun games with the family.', role: 'Dad' },
      { name: 'Brother', emoji: '👦', fact: 'A brother is a sibling to share toys, games, and fun adventures with.', role: 'Sibling' },
      { name: 'Sister', emoji: '👧', fact: 'A sister is a caring sibling and friend who shares stories and laughter.', role: 'Sibling' },
      { name: 'Grandfather', emoji: '👴', fact: 'Grandfathers tell wisdom stories, play, and give sweet treats!', role: 'Grandpa' },
      { name: 'Grandmother', emoji: '👵', fact: 'Grandmothers give warm cuddles, bake yummy treats, and share love.', role: 'Grandma' },
      { name: 'Baby', emoji: '👶', fact: 'Babies need gentle care, milk bottles, soft lullabies, and smiles.', role: 'Little One' },
    ]
  },
  {
    id: 'school',
    title: 'School',
    emoji: '🏫',
    color: '#00B894',
    bg: 'rgba(0, 184, 148, 0.12)',
    description: 'Tools, places, and learning at school!',
    items: [
      { name: 'Backpack', emoji: '🎒', fact: 'Backpacks hold your notebooks, pencil box, and lunchbox safely.', role: 'Bag' },
      { name: 'Pencil', emoji: '✏️', fact: 'Pencils let you trace letters, draw pictures, and write stories.', role: 'Writing Tool' },
      { name: 'Book', emoji: '📖', fact: 'Books take you on magical adventures through words and colorful pictures.', role: 'Reading' },
      { name: 'Blackboard', emoji: '📋', fact: 'Teachers write lessons and draw shapes on the board for the whole class.', role: 'Class Board' },
      { name: 'Playground', emoji: '🛝', fact: 'School playgrounds have slides and swings to play with classmates.', role: 'Play Area' },
      { name: 'Scissors', emoji: '✂️', fact: 'Craft scissors help cut paper shapes safely for art projects.', role: 'Art Tool' },
    ]
  },
  {
    id: 'nature',
    title: 'Nature',
    emoji: '🌲',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Wonders of planet Earth & natural elements!',
    items: [
      { name: 'Mountain', emoji: '⛰️', fact: 'Mountains are huge rocky landforms reaching high into the clouds.', role: 'Peak' },
      { name: 'River', emoji: '🏞️', fact: 'Rivers are flowing streams of fresh water that head towards oceans.', role: 'Flowing Water' },
      { name: 'Forest', emoji: '🌲', fact: 'Forests are large areas covered with trees, plants, and wildlife.', role: 'Woods' },
      { name: 'Ocean', emoji: '🌊', fact: 'Oceans cover over 70% of Earth with salt water full of sea life.', role: 'Deep Sea' },
      { name: 'Moon', emoji: '🌙', fact: 'The moon orbits Earth and shines softly in the night sky.', role: 'Night Sky' },
      { name: 'Volcano', emoji: '🌋', fact: 'Volcanoes are mountains with openings that can erupt with hot red lava.', role: 'Eruption' },
    ]
  }
]

export default function GeneralAwarenessModule() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('animals')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showGame, setShowGame] = useState(false)

  const activeCatObj = AWARENESS_CATEGORIES.find(c => c.id === activeCategory) || AWARENESS_CATEGORIES[0]

  const handleSpeakItem = (item) => {
    speakText(`${item.name}. ${item.fact}`)
  }

  if (showGame) {
    return (
      <WhoAmIGame
        game={{ id: 'who_am_i', title: 'Who Am I? Riddles' }}
        onBack={() => setShowGame(false)}
      />
    )
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '16px 16px 36px',
      fontFamily: 'var(--font-main)'
    }}>
      {/* 🚀 Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #00CEC9 0%, #8B5CF6 50%, #EC4899 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 20px',
        color: '#FFFFFF',
        textAlign: 'center',
        boxShadow: 'var(--shadow-float)',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ fontSize: 60, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>
          🌎
        </div>
        <h1 className="heading display-text" style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: '#FFFFFF', marginBottom: 6 }}>
          General Awareness Module
        </h1>
        <p style={{ opacity: 0.95, fontSize: 16, fontWeight: 700, maxWidth: 560, margin: '0 auto' }}>
          Explore Animals, Birds, Plants, Vehicles, Weather, Helpers & Real-World Concepts!
        </p>

        {/* Quick Launch "Who Am I?" Game Banner Button */}
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowGame(true)}
            style={{
              background: '#FFFFFF',
              color: '#8B5CF6',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'transform 0.2s ease'
            }}
            className="btn-child"
          >
            🕵️‍♂️ Play "Who Am I?" Riddle Game ▶
          </button>
        </div>
      </div>

      {/* 🏷️ Horizontal Category Selector Bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          CHOOSE A CATEGORY TO EXPLORE (12 CATEGORIES)
        </div>

        <div style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 10,
          scrollbarWidth: 'none'
        }}>
          {AWARENESS_CATEGORIES.map((cat) => {
            const isSelected = cat.id === activeCategory
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSelectedItem(null)
                  speakText(cat.title)
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: isSelected ? cat.color : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  border: `2px solid ${isSelected ? cat.color : 'var(--color-border)'}`,
                  fontWeight: 800,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 6px 18px ${cat.color}44` : 'var(--shadow-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                {cat.title}
              </button>
            )
          })}
        </div>
      </div>

      {/* 📖 Category Description */}
      <div style={{
        background: activeCatObj.bg,
        border: `2px solid ${activeCatObj.color}44`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>{activeCatObj.emoji}</span>
          <div>
            <h2 className="heading display-text" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
              {activeCatObj.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, marginTop: 2 }}>
              {activeCatObj.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => speakText(`${activeCatObj.title}. ${activeCatObj.description}`)}
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${activeCatObj.color}`,
            color: activeCatObj.color,
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          🔊 Listen
        </button>
      </div>

      {/* 🧩 Concept Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        {activeCatObj.items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              setSelectedItem(item)
              handleSpeakItem(item)
            }}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              border: `2px solid ${activeCatObj.color}33`,
              boxShadow: 'var(--shadow-card)',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="module-card"
          >
            <span style={{
              position: 'absolute', top: 10, right: 10,
              fontSize: 10, fontWeight: 800, background: `${activeCatObj.color}15`,
              color: activeCatObj.color, padding: '3px 7px', borderRadius: 99
            }}>
              {item.role || activeCatObj.title}
            </span>

            <div style={{ fontSize: 52, marginTop: 8 }}>{item.emoji}</div>

            <div style={{
              fontSize: 17,
              fontWeight: 900,
              color: 'var(--text-primary)',
              fontFamily: 'Baloo 2'
            }}>
              {item.name}
            </div>

            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 700,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {item.fact}
            </p>

            <div style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: 800,
              color: activeCatObj.color,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              🔊 Listen Fact
            </div>
          </div>
        ))}
      </div>

      {/* 🔍 Detailed Modal / Card Viewer */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            maxWidth: 480,
            width: '100%',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-float)',
            border: `3px solid ${activeCatObj.color}`,
            position: 'relative',
            animation: 'scaleUp 0.25s ease'
          }}>
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', fontSize: 24,
                cursor: 'pointer', color: 'var(--text-secondary)'
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: 72, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>
              {selectedItem.emoji}
            </div>

            <span className="badge badge-purple" style={{ background: activeCatObj.color, color: '#fff', marginBottom: 8 }}>
              {activeCatObj.title}
            </span>

            <h3 className="heading display-text" style={{ fontSize: 30, marginTop: 4, marginBottom: 10 }}>
              {selectedItem.name}
            </h3>

            <div style={{
              background: activeCatObj.bg,
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              marginBottom: 20
            }}>
              💡 <strong>Did You Know?</strong><br />
              {selectedItem.fact}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-primary btn-child"
                style={{ background: activeCatObj.color, borderColor: activeCatObj.color }}
                onClick={() => handleSpeakItem(selectedItem)}
              >
                🔊 Read Aloud
              </button>
              <button
                className="btn btn-secondary btn-child"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
