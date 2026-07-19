/*
BUILD 1 START
This file was extracted successfully from your project.
Next revision will replace this prototype with the enterprise onboarding wizard.
*/

import { useState } from "react";

export default function CustomerOnboardingPage() {
  const [step] = useState(1);

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Customer Onboarding
        </h1>

        <p className="text-gray-500 mt-2">
          Create a new customer workspace
        </p>
      </div>

      {/* Progress */}

      <div className="mb-8">

        <div className="flex justify-between mb-2">

          <span className="font-medium">
            Step {step} of 6
          </span>

          <span>
            17%
          </span>

        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">

          <div
            className="bg-blue-600 h-3 rounded-full"
            style={{ width: "17%" }}
          />

        </div>

      </div>

      {/* Step Indicator */}

      <div className="grid grid-cols-6 gap-2 mb-10">

        {[
          "Company",
          "Owner",
          "Subscription",
          "Modules",
          "Factory",
          "Review",
        ].map((item, index) => (
          <div
            key={item}
            className={`rounded-lg border p-3 text-center font-medium ${
              index === 0
                ? "bg-blue-600 text-white"
                : "bg-white"
            }`}
          >
            {index + 1}. {item}
          </div>
        ))}

      </div>

      {/* Content */}

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Form */}

        <div className="lg:col-span-2 rounded-xl border p-6">

          <h2 className="text-xl font-semibold mb-6">
            Company Information
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            <input
              placeholder="Company Name *"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Company Code"
              value="AUTO"
              readOnly
              className="border rounded-lg p-3 bg-gray-100"
            />

            <input
              placeholder="Business Type"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Industry"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Country"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Province / State"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="City"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Currency"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Time Zone"
              className="border rounded-lg p-3"
            />

            <input
              placeholder="Website"
              className="border rounded-lg p-3"
            />

          </div>

        </div>

        {/* Preview */}

        <div className="rounded-xl border p-6">

          <h2 className="text-xl font-semibold mb-5">
            Customer Summary
          </h2>

          <div className="space-y-4">

            <div>
              <div className="text-sm text-gray-500">
                Company
              </div>

              <div className="font-semibold">
                —
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Company Code
              </div>

              <div className="font-semibold">
                AUTO
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Country
              </div>

              <div className="font-semibold">
                —
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Currency
              </div>

              <div className="font-semibold">
                —
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer */}

      <div className="flex justify-between mt-10">

        <button className="border px-6 py-3 rounded-lg">
          Cancel
        </button>

        <div className="space-x-3">

          <button className="border px-6 py-3 rounded-lg">
            Save Draft
          </button>

          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            Continue to Owner →
          </button>

        </div>

      </div>

    </div>
  );
}
