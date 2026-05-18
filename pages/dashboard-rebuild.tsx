

```tsx
import { useState } from 'react'

export default function DashboardRebuild() {
  const [selectedStyle, setSelectedStyle] = useState('Luxury Modern')

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-gray-900">

      {/* ============================================ */}
      {/* TOP NAV */}
      {/* ============================================ */}

      <nav className="flex items-center justify-between px-8 py-5 border-b bg-white sticky top-0 z-50">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
            ✦
          </div>

          <div>
            <div className="font-semibold text-lg">
              StageAI
            </div>

            <div className="text-xs text-gray-500">
              AI Listing Media Workspace
            </div>
          </div>
        </div>


        <div className="hidden md:flex items-center gap-8 text-sm font-medium">

          <a className="cursor-pointer hover:text-black text-gray-600">
            Examples
          </a>

          <a className="cursor-pointer hover:text-black text-gray-600">
            Pricing
          </a>

          <a className="cursor-pointer hover:text-black text-gray-600">
            How It Works
          </a>

        </div>


        <div className="flex items-center gap-3">

          <button className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-100">
            Login
          </button>

          <button className="px-5 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800">
            Start Free
          </button>

        </div>

      </nav>



      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}

      <section className="px-8 py-20">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          <div>

            <div className="inline-flex items-center gap-2 bg-white border rounded-full px-4 py-2 text-sm font-medium mb-6">
              AI-Powered Listing Media Workspace
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Turn Empty Listing Photos Into Market-Ready Images In Seconds
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              AI staging, instant variations, twilight conversions, and MLS-ready exports built for agents, photographers, and brokerages.
            </p>


            <div className="flex flex-wrap gap-4">

              <button className="px-8 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800">
                Start Free
              </button>

              <button className="px-8 py-4 rounded-2xl border border-gray-300 bg-white font-semibold hover:bg-gray-100">
                View Examples
              </button>

            </div>

          </div>



          {/* BEFORE / AFTER CARD */}

          <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">

            <div className="grid grid-cols-2">

              <div className="h-[420px] bg-gray-200 flex items-center justify-center text-gray-500">
                BEFORE
              </div>

              <div className="h-[420px] bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                AFTER
              </div>

            </div>


            <div className="p-6">

              <div className="flex flex-wrap gap-2">

                <span className="px-4 py-2 rounded-full bg-gray-100 text-sm">
                  Luxury Modern
                </span>

                <span className="px-4 py-2 rounded-full bg-gray-100 text-sm">
                  Warm Organic
                </span>

                <span className="px-4 py-2 rounded-full bg-gray-100 text-sm">
                  Airbnb Bright
                </span>

                <span className="px-4 py-2 rounded-full bg-gray-100 text-sm">
                  Modern Farmhouse
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* ============================================ */}
      {/* DASHBOARD */}
      {/* ============================================ */}

      <section className="px-8 pb-20">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[260px_1fr] gap-8">

          {/* SIDEBAR */}

          <aside className="bg-white rounded-3xl border p-6 h-fit sticky top-28">

            <div className="mb-8">

              <div className="text-xs uppercase tracking-wider text-gray-400 mb-3">
                Workspace
              </div>

              <div className="space-y-2">

                <button className="w-full text-left px-4 py-3 rounded-xl bg-black text-white font-medium">
                  Dashboard
                </button>

                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100">
                  Properties
                </button>

                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100">
                  Create New
                </button>

              </div>

            </div>



            <div>

              <div className="text-xs uppercase tracking-wider text-gray-400 mb-3">
                Account
              </div>

              <div className="space-y-2">

                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100">
                  Billing
                </button>

                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100">
                  Settings
                </button>

              </div>

            </div>

          </aside>



          {/* MAIN CONTENT */}

          <main className="space-y-8">


            {/* HEADER */}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              <div>

                <h2 className="text-4xl font-bold mb-2">
                  Welcome Back, Jane
                </h2>

                <p className="text-gray-600">
                  Your AI-powered listing media workspace.
                </p>

              </div>


              <button className="px-8 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800">
                Create New Project
              </button>

            </div>



            {/* STATS */}

            <div className="grid md:grid-cols-4 gap-5">

              <div className="bg-white border rounded-3xl p-6">
                <div className="text-gray-500 text-sm mb-2">
                  Credits Remaining
                </div>

                <div className="text-4xl font-bold">
                  74
                </div>
              </div>


              <div className="bg-white border rounded-3xl p-6">
                <div className="text-gray-500 text-sm mb-2">
                  Active Projects
                </div>

                <div className="text-4xl font-bold">
                  12
                </div>
              </div>


              <div className="bg-white border rounded-3xl p-6">
                <div className="text-gray-500 text-sm mb-2">
                  Processing Jobs
                </div>

                <div className="text-4xl font-bold">
                  5
                </div>
              </div>


              <div className="bg-white border rounded-3xl p-6">
                <div className="text-gray-500 text-sm mb-2">
                  Failed Jobs
                </div>

                <div className="text-4xl font-bold">
                  1
                </div>
              </div>

            </div>



            {/* CREATE NEW */}

            <div className="bg-white border rounded-3xl p-8">

              <div className="flex items-center justify-between mb-8">

                <div>

                  <h3 className="text-2xl font-bold mb-2">
                    Create New Project
                  </h3>

                  <p className="text-gray-600">
                    Upload listing photos and generate AI staging instantly.
                  </p>

                </div>

              </div>



              {/* UPLOAD */}

              <div className="border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center bg-gray-50 hover:bg-gray-100 transition mb-10">

                <div className="text-6xl mb-6">
                  📤
                </div>

                <h4 className="text-2xl font-bold mb-3">
                  Drag & Drop Photos
                </h4>

                <p className="text-gray-600 mb-6">
                  JPG or PNG • Single or bulk upload • Up to 30 images
                </p>

                <button className="px-8 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800">
                  Choose Files
                </button>

              </div>



              {/* STYLE PRESETS */}

              <div className="mb-10">

                <h4 className="text-xl font-bold mb-5">
                  Choose AI Style
                </h4>

                <div className="grid md:grid-cols-4 gap-5">

                  {[
                    'Luxury Modern',
                    'Warm Organic',
                    'Modern Farmhouse',
                    'Airbnb Bright',
                  ].map((style) => (

                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`rounded-3xl border overflow-hidden transition ${
                        selectedStyle === style
                          ? 'border-black ring-2 ring-black'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >

                      <div className="h-44 bg-gradient-to-br from-gray-200 to-gray-300"></div>

                      <div className="p-5 text-left font-semibold">
                        {style}
                      </div>

                    </button>

                  ))}

                </div>

              </div>



              {/* ADVANCED OPTIONS */}

              <div className="mb-10">

                <h4 className="text-xl font-bold mb-5">
                  Advanced Options
                </h4>

                <div className="grid md:grid-cols-2 gap-5">

                  {[
                    'Remove Existing Furniture',
                    'Twilight Conversion',
                    'Luxury Upgrade',
                    'Object Removal',
                  ].map((option) => (

                    <label
                      key={option}
                      className="flex items-center gap-4 p-5 rounded-2xl border bg-gray-50"
                    >

                      <input type="checkbox" className="w-5 h-5" />

                      <span className="font-medium">
                        {option}
                      </span>

                    </label>

                  ))}

                </div>

              </div>



              {/* CREDIT ESTIMATE */}

              <div className="bg-gray-100 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-5 mb-8">

                <div className="text-lg">
                  Estimated Credits:
                  <strong className="ml-2">
                    12
                  </strong>
                </div>

                <div className="text-lg">
                  Queue Time:
                  <strong className="ml-2">
                    ~45 Seconds
                  </strong>
                </div>

              </div>



              <button className="w-full px-8 py-5 rounded-2xl bg-black text-white text-lg font-semibold hover:bg-gray-800">
                Generate AI Staging
              </button>

            </div>



            {/* PROCESSING QUEUE */}

            <div className="bg-white border rounded-3xl p-8">

              <h3 className="text-2xl font-bold mb-6">
                Processing Queue
              </h3>


              <div className="space-y-5">

                <div className="border rounded-2xl p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div>

                      <div className="font-semibold">
                        living-room-main.jpg
                      </div>

                      <div className="text-sm text-gray-500">
                        Luxury Modern
                      </div>

                    </div>

                    <div className="text-sm font-medium">
                      Rendering...
                    </div>

                  </div>


                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

                    <div className="h-full bg-black w-[72%]"></div>

                  </div>

                </div>

              </div>

            </div>



            {/* RECENT RENDERS */}

            <div className="bg-white border rounded-3xl p-8">

              <div className="flex items-center justify-between mb-8">

                <h3 className="text-2xl font-bold">
                  Recent AI Renders
                </h3>

                <button className="px-5 py-3 rounded-xl border hover:bg-gray-100">
                  View All
                </button>

              </div>



              <div className="grid md:grid-cols-2 gap-8">

                <div className="border rounded-3xl overflow-hidden">

                  <div className="grid grid-cols-2">

                    <div className="h-[280px] bg-gray-200 flex items-center justify-center">
                      BEFORE
                    </div>

                    <div className="h-[280px] bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-white font-bold">
                      AFTER
                    </div>

                  </div>


                  <div className="p-6">

                    <div className="flex items-center justify-between mb-5">

                      <div>

                        <h4 className="font-bold text-lg">
                          Luxury Modern
                        </h4>

                        <div className="text-sm text-gray-500">
                          Watermarked Preview
                        </div>

                      </div>


                      <div className="px-4 py-2 rounded-full bg-black text-white text-xs font-semibold">
                        PREVIEW
                      </div>

                    </div>



                    <div className="grid grid-cols-2 gap-3">

                      <button className="px-4 py-3 rounded-xl bg-black text-white font-medium">
                        Download HD
                      </button>

                      <button className="px-4 py-3 rounded-xl border hover:bg-gray-100">
                        Variation
                      </button>

                      <button className="px-4 py-3 rounded-xl border hover:bg-gray-100">
                        Twilight
                      </button>

                      <button className="px-4 py-3 rounded-xl border hover:bg-gray-100">
                        Favorite
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>



          </main>

        </div>

      </section>

    </div>
  )
}
```



DONE.
