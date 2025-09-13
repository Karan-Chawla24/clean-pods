"use client";

import Header from "../components/Header";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import FadeInOnScroll from "../components/FadeInOnScroll";

export default function TermsAndConditions() {
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
            T&amp;C
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Please read our terms and conditions carefully.
          </p>
        </FadeInOnScroll>

        {/* Terms and Conditions Content */}
        <FadeInOnScroll
          delay={0.1}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100"
        >
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms &amp; Conditions</h2>
            
            <div className="space-y-4">
              <p>
                <strong>1.</strong> This document is an electronic record in terms of Information Technology Act, 2000 and rules 
                there under as applicable and the amended provisions pertaining to electronic records in various 
                statutes as amended by the Information Technology Act, 2000. This electronic record is generated 
                by a computer system and does not require any physical or digital signatures.
              </p>
              
              <p>
                <strong>2.</strong> This document is published in accordance with the provisions of Rule 3 (1) of the Information 
                Technology (Intermediaries guidelines) Rules, 2011 that require publishing the rules and 
                regulations, privacy policy and Terms of Use for access or usage of domain name https://www.
                bubblebeads.in (&apos;Website&apos;), including the related mobile site and mobile application (hereinafter 
                referred to as &apos;Platform&apos;).
              </p>
              
              <p>
                <strong>3.</strong> The Platform is owned by R AND D ESSENTIALS TRADING CO, a company incorporated 
                under the Companies Act, 1956 with its registered office at 02830-004, Bathinda St No 4, Phase 4 
                ,Bathinda ,India (hereinafter referred to as &apos;Platform Owner&apos;, &apos;we&apos;, &apos;us&apos;, &apos;our&apos;).
              </p>
              
              <p>
                <strong>4.</strong> Your use of the Platform and services and tools are governed by the following terms and 
                conditions (&quot;Terms of Use&quot;) as applicable to the Platform including the applicable policies which 
                are incorporated herein by way of reference. If You transact on the Platform, You shall be subject 
                to the policies that are applicable to the Platform for such transaction. By mere use of the Platform, 
                You shall be contracting with the Platform Owner and these terms and conditions including the 
                policies constitute Your binding obligations, with Platform Owner. These Terms of Use relate to 
                your use of our website, goods (as applicable) or services (as applicable) (collectively, &apos;Services&apos;). 
                Any terms and conditions proposed by You which are in addition to or which conflict with these 
                Terms of Use are expressly rejected by the Platform Owner and shall be of no force or effect. 
                These Terms of Use can be modified at any time without assigning any reason. It is your 
                responsibility to periodically review these Terms of Use to stay informed of updates.
              </p>
              
              <p>
                <strong>5.</strong> For the purpose of these Terms of Use, wherever the context so requires &apos;you&apos;, &apos;your&apos; or &apos;user&apos; shall 
                mean any natural or legal person who has agreed to become a user/buyer on the Platform.
              </p>
              
              <p>
                <strong>6.</strong> ACCESSING, BROWSING OR OTHERWISE USING THE PLATFORM INDICATES YOUR 
                AGREEMENT TO ALL THE TERMS AND CONDITIONS UNDER THESE TERMS OF USE, 
                SO PLEASE READ THE TERMS OF USE CAREFULLY BEFORE PROCEEDING.
              </p>
              
              <p>
                <strong>7.</strong> The use of Platform and/or availing of our Services is subject to the following Terms of Use:
              </p>
              
              <div className="ml-6 space-y-3">
                <p>
                  <strong>1.</strong> To access and use the Services, you agree to provide true, accurate and complete information 
                  to us during and after registration, and you shall be responsible for all acts done through the 
                  use of your registered account on the Platform.
                </p>
                
                <p>
                  <strong>2.</strong> Neither we nor any third parties provide any warranty or guarantee as to the accuracy, 
                  timeliness, performance, completeness or suitability of the information and materials offered 
                  on this website or through the Services, for any specific purpose. You acknowledge that such 
                  information and materials may contain inaccuracies or errors and we expressly exclude 
                  liability for any such inaccuracies or errors to the fullest extent permitted by law.
                </p>
                
                <p>
                  <strong>3.</strong> Your use of our Services and the Platform is solely and entirely at your own risk and 
                  discretion for which we shall not be liable to you in any manner. You are required to 
                  independently assess and ensure that the Services meet your requirements.
                </p>
                
                <p>
                  <strong>4.</strong> The contents of the Platform and the Services are proprietary to us and are licensed to us. 
                  You will not have any authority to claim any intellectual property rights, title, or interest in 
                  its contents. The contents includes and is not limited to the design, layout, look and graphics.
                </p>
                
                <p>
                  <strong>5.</strong> You acknowledge that unauthorized use of the Platform and/or the Services may lead to 
                  action against you as per these Terms of Use and/or applicable laws.
                </p>
                
                <p>
                  <strong>6.</strong> You agree to pay us the charges associated with availing the Services.
                </p>
                
                <p>
                  <strong>7.</strong> You agree not to use the Platform and/ or Services for any purpose that is unlawful, illegal or 
                  forbidden by these Terms, or Indian or local laws that might apply to you.
                </p>
                
                <p>
                  <strong>8.</strong> You agree and acknowledge that website and the Services may contain links to other third 
                  party websites. On accessing these links, you will be governed by the terms of use, privacy 
                  policy and such other policies of such third party websites. These links are provided for your 
                  convenience for provide further information.
                </p>
                
                <p>
                  <strong>9.</strong> You understand that upon initiating a transaction for availing the Services you are entering 
                  into a legally binding and enforceable contract with the Platform Owner for the Services.
                </p>
                
                <p>
                  <strong>10.</strong> You shall indemnify and hold harmless Platform Owner, its affiliates, group companies (as 
                  applicable) and their respective officers, directors, agents, and employees, from any claim or 
                  demand, or actions including reasonable attorney&apos;s fees, made by any third party or penalty 
                  imposed due to or arising out of Your breach of this Terms of Use, privacy Policy and other 
                  Policies, or Your violation of any law, rules or regulations or the rights (including 
                  infringement of intellectual property rights) of a third party.
                </p>
                
                <p>
                  <strong>11.</strong> Notwithstanding anything contained in these Terms of Use, the parties shall not be liable for 
                  any failure to perform an obligation under these Terms if performance is prevented or 
                  delayed by a force majeure event.
                </p>
                
                <p>
                  <strong>12.</strong> These Terms and any dispute or claim relating to it, or its enforceability, shall be governed 
                  by and construed in accordance with the laws of India.
                </p>
                
                <p>
                  <strong>13.</strong> All disputes arising out of or in connection with these Terms shall be subject to the exclusive 
                  jurisdiction of the courts in Bathinda and Punjab.
                </p>
                
                <p>
                  <strong>14.</strong> All concerns or communications relating to these Terms must be communicated to us using 
                  the contact information provided on this website.
                </p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}