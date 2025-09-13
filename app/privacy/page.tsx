"use client";

import Header from "../components/Header";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import FadeInOnScroll from "../components/FadeInOnScroll";

export default function Privacy() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <FadeInOnScroll className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Please read our privacy policy carefully.
          </p>
        </FadeInOnScroll>

        {/* Privacy Policy Content */}
        <FadeInOnScroll
          delay={0.1}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100"
        >
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h3>
                <p>
                  This Privacy Policy describes how R AND D ESSENTIALS TRADING CO and its affiliates 
                  (collectively "R AND D ESSENTIALS TRADING CO, we, our, us") collect, use, share, protect or 
                  otherwise process your information/ personal data through our website https://www.bubblebeads.in
                  (hereinafter referred to as Platform). Please note that you may be able to browse certain sections of the 
                  Platform without registering with us. We do not offer any product/service under this Platform outside 
                  India and your personal data will primarily be stored and processed in India. By visiting this Platform, 
                  providing your information or availing any product/service offered on the Platform, you expressly agree 
                  to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable 
                  service/product terms and conditions, and agree to be governed by the laws of India including but not 
                  limited to the laws applicable to data protection and privacy. If you do not agree please do not use or 
                  access our Platform.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Collection</h3>
                <p>
                  We collect your personal data when you use our Platform, services or otherwise interact with 
                  us during the course of our relationship and related information provided from time to time. Some of the 
                  information that we may collect includes but is not limited to personal data / information provided to us 
                  during sign-up/registering or using our Platform such as name, date of birth, address, telephone/mobile 
                  number, email ID and/or any such information shared as proof of identity or address. Some of the 
                  sensitive personal data may be collected with your consent, such as your bank account or credit or debit 
                  card or other payment instrument information or biometric information such as your facial features or 
                  physiological information (in order to enable use of certain features when opted for, available on the 
                  Platform) etc all of the above being in accordance with applicable law(s). You always have the option to 
                  not provide information, by choosing not to use a particular service or feature on the Platform.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage</h3>
                <p>
                  We use personal data to provide the services you request. To the extent we use your personal data 
                  to market to you, we will provide you the ability to opt-out of such uses. We use your personal data to 
                  assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; to 
                  resolve disputes; troubleshoot problems; inform you about online and offline offers, products, services, 
                  and updates; customise your experience; detect and protect us against error, fraud and other criminal 
                  activity; enforce our terms and conditions; conduct marketing research, analysis and surveys; and as 
                  otherwise described to you at the time of collection of information.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Sharing</h3>
                <p>
                  We may share your personal data internally within our group entities, our other corporate 
                  entities, and affiliates to provide you access to the services and products offered by them. These entities 
                  and affiliates may market to you as a result of such sharing unless you explicitly opt-out. We may 
                  disclose personal data to third parties such as sellers, business partners, third party service providers 
                  including logistics partners, prepaid payment instrument issuers, third-party reward programs and other 
                  payment opted by you.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Security Precautions</h3>
                <p>
                  To protect your personal data from unauthorised access or disclosure, loss or 
                  misuse we adopt reasonable security practices and procedures. Once your information is in our 
                  possession or whenever you access your account information, we adhere to our security guidelines to 
                  protect it against unauthorised access and offer the use of a secure server.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Deletion and Retention</h3>
                <p>
                  You have an option to delete your account by visiting your profile and 
                  settings on our Platform, this action would result in you losing all information related to your account. 
                  You may also write to us at the contact information provided below to assist you with these requests.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h3>
                <p>
                  You may access, rectify, and update your personal data directly through the functionalities 
                  provided on the Platform.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Consent</h3>
                <p>
                  By visiting our Platform or by providing your information, you consent to the collection, use, 
                  storage, disclosure and otherwise processing of your information on the Platform in accordance with this 
                  Privacy Policy. If you disclose to us any personal data relating to other people, you represent that you 
                  have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Changes to this Privacy Policy</h3>
                <p>
                  Please check our Privacy Policy periodically for changes. We may 
                  update this Privacy Policy to reflect changes to our information practices. We may alert / notify you 
                  about the significant changes to the Privacy Policy, in the manner as may be required under applicable 
                  laws.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Grievance Officer</h3>
                <p>
                  Insert Name of the Office:<br/>
                  Designation:<br/>
                  Insert Name and Address of the Company:<br/>
                  Contact us:
                </p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}