import { GoogleAuth, AppleAuth } from './GAuth';
import { useEffect, useState, useContext } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ResearchContext } from '../ResearchContext';
import FlagIcon from '@mui/icons-material/Flag';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import BlockIcon from '@mui/icons-material/Block';
import './Modal.css'

const Modal = ({ 
    show, 
    title, 
    message, 
    warningLevel,
    onClose,
    action = null,
    actionText = null,
    actionClass = null
}) => {
    // Define styles and content based on warning level
    const getModalStyles = (level) => {
        switch (level) {
            case 0: // Error
                return {
                    iconClass: 'error',
                    icon: '❌',
                    buttonText: 'Try Again',
                    buttonClass: 'error'
                };
            case 1: // Warning
                if (action !== null) {
                    return {
                        iconClass: 'warning',
                        icon: '⚠️',
                        buttonText: 'Cancel',
                        buttonClass: 'warning'
                    };
                }

                return {
                    iconClass: 'warning',
                    icon: '⚠️',
                    buttonText: 'OK',
                    buttonClass: 'warning'
                };
            case 2: // Success
                return {
                    iconClass: 'success',
                    icon: '✓',
                    buttonText: 'Great!',
                    buttonClass: 'success'
                };
            default:
                return {
                    iconClass: 'error',
                    icon: '❌',
                    buttonText: 'OK',
                    buttonClass: 'error'
                };
        }
    };

    const modalStyles = getModalStyles(warningLevel);

    return (
        <div 
            className={`modal-overlay ${show ? 'show' : ''}`}
            onClick={onClose}
        >
            <div 
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`modal-icon ${modalStyles.iconClass}`}>
                    {modalStyles.icon}
                </div>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <button 
                    className={`modal-button ${modalStyles.buttonClass}`}
                    onClick={onClose}
                >
                    {modalStyles.buttonText}
                </button>

                {(action !== null) && (actionText === null) && <button className='modal-button modal-btn-confirm' onClick={action}>Confirm</button>}
                {(action !== null) && (actionText !== null) && (actionClass !== null) && <button className={"modal-button " + actionClass} onClick={action}>{actionText}</button>}
            </div>
        </div>
    );
};

const FactModal = ({
    show,
    title,
    description,
    user,       // username (display)
    userId,     // user ID (for blocking)
    factId,
    onClose
}) => {
    const { currentUser, blockUser, unblockUser, flagFact, unflagFact } = useContext(ResearchContext);

    const isBlocked = currentUser?.blocked?.includes(userId) ?? false;
    const isFlagged = currentUser?.flaggedFacts?.includes(factId) ?? false;

    if (!show) return null;

    const isLongContent = description && description.length > 200;
    const showActions = currentUser && userId && userId !== currentUser.id;

    const handleBlock = async () => {
        if (isBlocked) {
            await unblockUser(userId);
        } else {
            await blockUser(userId);
            onClose();
        }
    };

    const handleFlag = async () => {
        if (isFlagged) {
            await unflagFact(factId);
        } else {
            await flagFact(factId);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="fact-popup" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="title">{title}</h2>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close modal">×</button>
                </div>

                <p className="author">Submitted by {user}</p>

                <p className={`popup-description ${isLongContent ? 'long-content' : ''}`}>
                    {description}
                </p>

                {showActions && (
                    <div className="fact-modal-actions">
                        <button
                            className={`fact-modal-action-btn ${isFlagged ? 'flagged' : ''}`}
                            onClick={handleFlag}
                            title={isFlagged ? 'Remove flag' : 'Flag content'}
                        >
                            {isFlagged
                                ? <FlagIcon fontSize="small" />
                                : <OutlinedFlagIcon fontSize="small" />}
                            {isFlagged ? 'Flagged' : 'Flag'}
                        </button>
                        <button
                            className={`fact-modal-action-btn ${isBlocked ? 'blocked' : ''}`}
                            onClick={handleBlock}
                            title={isBlocked ? 'Unblock user' : 'Block user'}
                        >
                            <BlockIcon fontSize="small" />
                            {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ComponentModal = ({
    show,
    component,
    onClose
}) => {
    if (!show) return null;

    return (
        <>
        <div className="modal-backdrop-component" onClick={onClose}>
            <div className='component-container' onClick={(e) => e.stopPropagation()}>
                {component}
            </div>       
        </div>
        </>
    )
}

const LoginModal = ({
    show,
    onClose,
    loginState,
    setLoginState
}) => {
    if (!show) return null;

    return (
        <div 
            className={`modal-overlay ${show ? 'show' : ''}`}
            onClick={onClose}
        >
            <div 
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="title">Login</h2>
                    <button 
                        className="modal-close-button"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                {(loginState === -1) && <div className='modal-login'>
                    <GoogleAuth loginState={loginState} setLoginState={setLoginState}/>
                    <AppleAuth loginState={loginState} setLoginState={setLoginState}/>
                </div>}

                {(loginState === 0) && <div className='modal-login'>
                    <button className='modal-button error' onClick={onClose}>Error Logging in!</button>
                </div>}

                {(loginState === 1) && <div className='modal-login'>
                    <button className='modal-button success' onClick={onClose}>Logged in!</button>
                </div>}
            </div>       
        </div>
    )
}

const TutorialModal = ({
    show,
    onClose,
    titles,
    descriptions,
    pageCount,
    Icons
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [onLastPage, setOnLastPage] = useState(false);

    useEffect(() => {
        if (currentPage + 1 === pageCount) {
            setOnLastPage(true);
        }
    }, [currentPage]);

    if (!show) return null;

    const handleNextPage = () => {
        setCurrentPage(currentPage + 1);
    }

    return (
        <div 
            className={`modal-overlay ${show ? 'show' : ''}`}
        >
            <div 
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className='tutorial-modal-icon'>
                        {Icons[currentPage]}
                    </div>          
                    <h2 className="title">{titles[currentPage]}</h2>
                </div>

                <p className="modal-message">{descriptions[currentPage]}</p>

                {(!onLastPage) && <button className='modal-button tutorial-next' onClick={handleNextPage}>Next <ArrowForwardIcon/></button>}

                {(onLastPage) && <button className='modal-button tutorial-complete' onClick={onClose}>Great!</button>}
            </div>       
        </div>
    )
}

const EULAModal = ({
    show,
    onClose,
    onAccept,
    onDecline
}) => {
    if (!show) return null;

    const handleAccept = () => {
        if (onAccept) onAccept();
        onClose();
    };

    const handleDecline = () => {
        if (onDecline) onDecline();
        onClose();
    };

    return (
        <div className={`eula-overlay ${show ? 'show' : ''}`} onClick={onClose}>
            <div className="eula-container" onClick={(e) => e.stopPropagation()}>

                {/* ── Sticky header ── */}
                <div className="eula-header">
                    <h2 className="eula-header-title">End User License Agreement</h2>
                    <span className="eula-header-date">Last updated: February 25, 2026</span>
                    <button className="eula-close-button" onClick={onClose} aria-label="Close">×</button>
                </div>

                {/* ── Scrollable document ── */}
                <div className="eula-body">
                    <div className="eula-doc">
                        <h1 className="eula-doc-title">END USER LICENSE AGREEMENT</h1>
                        <p className="eula-doc-subtitle">Last updated <strong>February 25, 2026</strong></p>

                        <p>
                            FactDrop is licensed to You (End-User) by RigneyCo, located and registered at
                            1800 Lincoln Ave, Evansville, Indiana 47714, United States (<strong>"Licensor"</strong>),
                            for use only under the terms of this License Agreement.
                        </p>

                        <p>
                            By downloading the Licensed Application from Apple's software distribution platform
                            (<strong>"App Store"</strong>) and Google's software distribution platform (<strong>"Play Store"</strong>),
                            and any update thereto (as permitted by this License Agreement), You indicate that You agree
                            to be bound by all of the terms and conditions of this License Agreement, and that You accept
                            this License Agreement. App Store and Play Store are referred to in this License Agreement as{' '}
                            <strong>"Services."</strong>
                        </p>

                        <p>
                            The parties of this License Agreement acknowledge that the Services are not a Party to this
                            License Agreement and are not bound by any provisions or obligations with regard to the Licensed
                            Application, such as warranty, liability, maintenance and support thereof. RigneyCo, not the
                            Services, is solely responsible for the Licensed Application and the content thereof.
                        </p>

                        <p>
                            This License Agreement may not provide for usage rules for the Licensed Application that are in
                            conflict with the latest{' '}
                            <a href="https://www.apple.com/legal/internet-services/itunes/us/terms.html" target="_blank" rel="noopener noreferrer">
                                Apple Media Services Terms and Conditions
                            </a>{' '}
                            and{' '}
                            <a href="https://play.google.com/intl/en_US/about/play-terms/" target="_blank" rel="noopener noreferrer">
                                Google Play Terms of Service
                            </a>{' '}
                            (<strong>"Usage Rules"</strong>). RigneyCo acknowledges that it had the opportunity to review the
                            Usage Rules and this License Agreement is not conflicting with them.
                        </p>

                        <p>
                            FactDrop when purchased or downloaded through the Services, is licensed to You for use only
                            under the terms of this License Agreement. The Licensor reserves all rights not expressly
                            granted to You. FactDrop is to be used on devices that operate with Apple's operating systems
                            ("iOS" and "Mac OS") or Google's operating system ("Android").
                        </p>

                        {/* Table of Contents */}
                        <h2 className="eula-doc-h2">TABLE OF CONTENTS</h2>
                        <ul className="eula-toc">
                            {[
                                ['#application',   '1. THE APPLICATION'],
                                ['#scope',         '2. SCOPE OF LICENSE'],
                                ['#requirements',  '3. TECHNICAL REQUIREMENTS'],
                                ['#support',       '4. MAINTENANCE AND SUPPORT'],
                                ['#datause',       '5. USE OF DATA'],
                                ['#ugc',           '6. USER-GENERATED CONTRIBUTIONS'],
                                ['#contribution',  '7. CONTRIBUTION LICENSE'],
                                ['#liability',     '8. LIABILITY'],
                                ['#warranty',      '9. WARRANTY'],
                                ['#productclaims', '10. PRODUCT CLAIMS'],
                                ['#compliance',    '11. LEGAL COMPLIANCE'],
                                ['#contact',       '12. CONTACT INFORMATION'],
                                ['#termination',   '13. TERMINATION'],
                                ['#thirdparty',    '14. THIRD-PARTY TERMS OF AGREEMENTS AND BENEFICIARY'],
                                ['#ipr',           '15. INTELLECTUAL PROPERTY RIGHTS'],
                                ['#law',           '16. APPLICABLE LAW'],
                                ['#misc',          '17. MISCELLANEOUS'],
                            ].map(([href, label]) => (
                                <li key={href}><a href={href}>{label}</a></li>
                            ))}
                        </ul>

                        {/* 1 */}
                        <h2 className="eula-doc-h2" id="application">1. THE APPLICATION</h2>
                        <p>
                            FactDrop (<strong>"Licensed Application"</strong>) is a piece of software created to allow
                            placement of information and facts tied to real world locations — and customized for iOS and
                            Android mobile devices (<strong>"Devices"</strong>). It is used to share information tied to
                            specific geolocations, and have fun.
                        </p>
                        <p>
                            The Licensed Application is not tailored to comply with industry-specific regulations
                            (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security
                            Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you
                            may not use this Licensed Application. You may not use the Licensed Application in a way that
                            would violate the Gramm-Leach-Bliley Act (GLBA).
                        </p>

                        {/* 2 */}
                        <h2 className="eula-doc-h2" id="scope">2. SCOPE OF LICENSE</h2>
                        <p>
                            2.1 &nbsp; You are given a non-transferable, non-exclusive, non-sublicensable license to
                            install and use the Licensed Application on any Devices that You (End-User) own or control
                            and as permitted by the Usage Rules, with the exception that such Licensed Application may be
                            accessed and used by other accounts associated with You (End-User, The Purchaser) via Family
                            Sharing or volume purchasing.
                        </p>
                        <p>
                            2.2 &nbsp; This license will also govern any updates of the Licensed Application provided by
                            Licensor that replace, repair, and/or supplement the first Licensed Application, unless a
                            separate license is provided for such update, in which case the terms of that new license
                            will govern.
                        </p>
                        <p>
                            2.3 &nbsp; You may not share or make the Licensed Application available to third parties
                            (unless to the degree allowed by the Usage Rules, and with RigneyCo's prior written consent),
                            sell, rent, lend, lease or otherwise redistribute the Licensed Application.
                        </p>
                        <p>
                            2.4 &nbsp; You may not copy (excluding when expressly authorized by this license and the
                            Usage Rules) or alter the Licensed Application or portions thereof. You may create and store
                            copies only on devices that You own or control for backup keeping under the terms of this
                            license, the Usage Rules, and any other terms and conditions that apply to the device or
                            software used. You may not remove any intellectual property notices. You acknowledge that no
                            unauthorized third parties may gain access to these copies at any time. If you sell your
                            Devices to a third party, you must remove the Licensed Application from the Devices before
                            doing so.
                        </p>
                        <p>2.5 &nbsp; Licensor reserves the right to modify the terms and conditions of licensing.</p>
                        <p>
                            2.6 &nbsp; Nothing in this license should be interpreted to restrict third-party terms. When
                            using the Licensed Application, You must ensure that You comply with applicable third-party
                            terms and conditions.
                        </p>

                        {/* 3 */}
                        <h2 className="eula-doc-h2" id="requirements">3. TECHNICAL REQUIREMENTS</h2>
                        <p>
                            3.1 &nbsp; Licensor attempts to keep the Licensed Application updated so that it complies
                            with modified/new versions of the firmware and new hardware. You are not granted rights to
                            claim such an update.
                        </p>
                        <p>
                            3.2 &nbsp; You acknowledge that it is Your responsibility to confirm and determine that the
                            app end-user device on which You intend to use the Licensed Application satisfies the
                            technical specifications mentioned above.
                        </p>
                        <p>
                            3.3 &nbsp; Licensor reserves the right to modify the technical specifications as it sees
                            appropriate at any time.
                        </p>

                        {/* 4 */}
                        <h2 className="eula-doc-h2" id="support">4. MAINTENANCE AND SUPPORT</h2>
                        <p>
                            4.1 &nbsp; The Licensor is solely responsible for providing any maintenance and support
                            services for this Licensed Application. You can reach the Licensor at the email address
                            listed in the App Store or Play Store Overview for this Licensed Application.
                        </p>
                        <p>
                            4.2 &nbsp; RigneyCo and the End-User acknowledge that the Services have no obligation
                            whatsoever to furnish any maintenance and support services with respect to the Licensed
                            Application.
                        </p>

                        {/* 5 */}
                        <h2 className="eula-doc-h2" id="datause">5. USE OF DATA</h2>
                        <p>
                            You acknowledge that Licensor will be able to access and adjust Your downloaded Licensed
                            Application content and Your personal information, and that Licensor's use of such material
                            and information is subject to Your legal agreements with Licensor and Licensor's privacy
                            policy:{' '}
                            <a href="https://privacy.coreyrigney.dev" target="_blank" rel="noopener noreferrer">
                                privacy.coreyrigney.dev
                            </a>.
                        </p>
                        <p>
                            You acknowledge that the Licensor may periodically collect and use technical data and related
                            information about your device, system, and application software, and peripherals, offer
                            product support, facilitate the software updates, and for purposes of providing other
                            services to you (if any) related to the Licensed Application. Licensor may also use this
                            information to improve its products or to provide services or technologies to you, as long as
                            it is in a form that does not personally identify you.
                        </p>

                        {/* 6 */}
                        <h2 className="eula-doc-h2" id="ugc">6. USER-GENERATED CONTRIBUTIONS</h2>
                        <p>
                            The Licensed Application may invite you to chat, contribute to, or participate in blogs,
                            message boards, online forums, and other functionality, and may provide you with the
                            opportunity to create, submit, post, display, transmit, perform, publish, distribute, or
                            broadcast content and materials to us or in the Licensed Application, including but not
                            limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or
                            personal information or other material (collectively, <strong>"Contributions"</strong>).
                            Contributions may be viewable by other users of the Licensed Application and through
                            third-party websites or applications. As such, any Contributions you transmit may be treated
                            as non-confidential and non-proprietary. When you create or make available any Contributions,
                            you thereby represent and warrant that:
                        </p>
                        <ul className="eula-list">
                            {[
                                'The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.',
                                'You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to use and to authorize us, the Licensed Application, and other users of the Licensed Application to use your Contributions in any manner contemplated by the Licensed Application and this License Agreement.',
                                'You have the written consent, release, and/or permission of each and every identifiable individual person in your Contributions to use the name or likeness of each and every such identifiable individual person to enable inclusion and use of your Contributions in any manner contemplated by the Licensed Application and this License Agreement.',
                                'Your Contributions are not false, inaccurate, or misleading.',
                                'Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.',
                                'Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise objectionable (as determined by us).',
                                'Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.',
                                'Your Contributions are not used to harass or threaten (in the legal sense of those terms) any other person and to promote violence against a specific person or class of people.',
                                'Your Contributions do not violate any applicable law, regulation, or rule.',
                                'Your Contributions do not violate the privacy or publicity rights of any third party.',
                                'Your Contributions do not violate any applicable law concerning child pornography, or otherwise intended to protect the health or well-being of minors.',
                                'Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.',
                                'Your Contributions do not otherwise violate, or link to material that violates, any provision of this License Agreement, or any applicable law or regulation.',
                            ].map((text, i) => (
                                <li key={i} data-n={i + 1}>{text}</li>
                            ))}
                        </ul>
                        <p>
                            Any use of the Licensed Application in violation of the foregoing violates this License
                            Agreement and may result in, among other things, termination or suspension of your rights
                            to use the Licensed Application.
                        </p>

                        {/* 7 */}
                        <h2 className="eula-doc-h2" id="contribution">7. CONTRIBUTION LICENSE</h2>
                        <p>
                            By posting your Contributions to any part of the Licensed Application or making Contributions
                            accessible to the Licensed Application by linking your account from the Licensed Application
                            to any of your social networking accounts, you automatically grant, and you represent and
                            warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable,
                            perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and
                            license to host, use copy, reproduce, disclose, sell, resell, publish, broadcast, retitle,
                            archive, store, cache, publicly display, reformat, translate, transmit, excerpt (in whole or
                            in part), and distribute such Contributions (including, without limitation, your image and
                            voice) for any purpose, commercial advertising, or otherwise, and to prepare derivative
                            works of, or incorporate in other works, such as Contributions, and grant and authorize
                            sublicenses of the foregoing. The use and distribution may occur in any media formats and
                            through any media channels.
                        </p>
                        <p>
                            This license will apply to any form, media, or technology now known or hereafter developed,
                            and includes our use of your name, company name, and franchise name, as applicable, and any
                            of the trademarks, service marks, trade names, logos, and personal and commercial images you
                            provide. You waive all moral rights in your Contributions, and you warrant that moral rights
                            have not otherwise been asserted in your Contributions.
                        </p>
                        <p>
                            We do not assert any ownership over your Contributions. You retain full ownership of all of
                            your Contributions and any intellectual property rights or other proprietary rights associated
                            with your Contributions. We are not liable for any statements or representations in your
                            Contributions provided by you in any area in the Licensed Application. You are solely
                            responsible for your Contributions to the Licensed Application and you expressly agree to
                            exonerate us from any and all responsibility and to refrain from any legal action against us
                            regarding your Contributions.
                        </p>
                        <p>
                            We have the right, in our sole and absolute discretion, (1) to edit, redact, or otherwise
                            change any Contributions; (2) to recategorize any Contributions to place them in more
                            appropriate locations in the Licensed Application; and (3) to prescreen or delete any
                            Contributions at any time and for any reason, without notice. We have no obligation to
                            monitor your Contributions.
                        </p>

                        {/* 8 */}
                        <h2 className="eula-doc-h2" id="liability">8. LIABILITY</h2>
                        <p>
                            8.1 &nbsp; Licensor's responsibility in the case of violation of obligations and tort shall
                            be limited to intent and gross negligence. Only in case of a breach of essential contractual
                            duties (cardinal obligations), Licensor shall also be liable in case of slight negligence.
                            In any case, liability shall be limited to the foreseeable, contractually typical damages.
                            The limitation mentioned above does not apply to injuries to life, limb, or health.
                        </p>
                        <p>
                            8.2 &nbsp; Licensor takes no accountability or responsibility for any damages caused due to
                            a breach of duties according to Section 2 of this License Agreement. To avoid data loss, You
                            are required to make use of backup functions of the Licensed Application to the extent
                            allowed by applicable third-party terms and conditions of use. You are aware that in case of
                            alterations or manipulations of the Licensed Application, You will not have access to the
                            Licensed Application.
                        </p>

                        {/* 9 */}
                        <h2 className="eula-doc-h2" id="warranty">9. WARRANTY</h2>
                        <p>
                            9.1 &nbsp; Licensor warrants that the Licensed Application is free of spyware, trojan
                            horses, viruses, or any other malware at the time of Your download. Licensor warrants that
                            the Licensed Application works as described in the user documentation.
                        </p>
                        <p>
                            9.2 &nbsp; No warranty is provided for the Licensed Application that is not executable on
                            the device, that has been unauthorizedly modified, handled inappropriately or culpably,
                            combined or installed with inappropriate hardware or software, used with inappropriate
                            accessories, regardless if by Yourself or by third parties, or if there are any other
                            reasons outside of RigneyCo's sphere of influence that affect the executability of the
                            Licensed Application.
                        </p>
                        <p>
                            9.3 &nbsp; You are required to inspect the Licensed Application immediately after installing
                            it and notify RigneyCo about issues discovered without delay by email provided in{' '}
                            <a href="#contact">Contact Information</a>. The defect report will be taken into
                            consideration and further investigated if it has been emailed within a period of ninety (90)
                            days after discovery.
                        </p>
                        <p>
                            9.4 &nbsp; If we confirm that the Licensed Application is defective, RigneyCo reserves a
                            choice to remedy the situation either by means of solving the defect or substitute delivery.
                        </p>
                        <p>
                            9.5 &nbsp; In the event of any failure of the Licensed Application to conform to any
                            applicable warranty, You may notify the Services Store Operator, and Your Licensed
                            Application purchase price will be refunded to You. To the maximum extent permitted by
                            applicable law, the Services Store Operator will have no other warranty obligation
                            whatsoever with respect to the Licensed Application, and any other losses, claims, damages,
                            liabilities, expenses, and costs attributable to any negligence to adhere to any warranty.
                        </p>
                        <p>
                            9.6 &nbsp; If the user is an entrepreneur, any claim based on faults expires after a
                            statutory period of limitation amounting to twelve (12) months after the Licensed
                            Application was made available to the user. The statutory periods of limitation given by
                            law apply for users who are consumers.
                        </p>

                        {/* 10 */}
                        <h2 className="eula-doc-h2" id="productclaims">10. PRODUCT CLAIMS</h2>
                        <p>
                            RigneyCo and the End-User acknowledge that RigneyCo, and not the Services, is responsible
                            for addressing any claims of the End-User or any third party relating to the Licensed
                            Application or the End-User's possession and/or use of that Licensed Application, including,
                            but not limited to:
                        </p>
                        <ul className="eula-list">
                            <li data-n="i">product liability claims;</li>
                            <li data-n="ii">any claim that the Licensed Application fails to conform to any applicable legal or regulatory requirement; and</li>
                            <li data-n="iii">claims arising under consumer protection, privacy, or similar legislation, including in connection with Your Licensed Application's use of the HealthKit and HomeKit.</li>
                        </ul>

                        {/* 11 */}
                        <h2 className="eula-doc-h2" id="compliance">11. LEGAL COMPLIANCE</h2>
                        <p>
                            You represent and warrant that You are not located in a country that is subject to a US
                            Government embargo, or that has been designated by the US Government as a "terrorist
                            supporting" country; and that You are not listed on any US Government list of prohibited or
                            restricted parties.
                        </p>

                        {/* 12 */}
                        <h2 className="eula-doc-h2" id="contact">12. CONTACT INFORMATION</h2>
                        <p>For general inquiries, complaints, questions or claims concerning the Licensed Application, please contact:</p>
                        <div className="eula-contact-block">
                            <p>Corey</p>
                            <p>1800 Lincoln Ave</p>
                            <p>Evansville, IN 47714</p>
                            <p>United States</p>
                            <p><a href="mailto:coreycoofficial@gmail.com">coreycoofficial@gmail.com</a></p>
                        </div>

                        {/* 13 */}
                        <h2 className="eula-doc-h2" id="termination">13. TERMINATION</h2>
                        <p>
                            The license is valid until terminated by RigneyCo or by You. Your rights under this license
                            will terminate automatically and without notice from RigneyCo if You fail to adhere to any
                            term(s) of this license. Upon License termination, You shall stop all use of the Licensed
                            Application, and destroy all copies, full or partial, of the Licensed Application.
                        </p>

                        {/* 14 */}
                        <h2 className="eula-doc-h2" id="thirdparty">14. THIRD-PARTY TERMS OF AGREEMENTS AND BENEFICIARY</h2>
                        <p>
                            RigneyCo represents and warrants that RigneyCo will comply with applicable third-party terms
                            of agreement when using Licensed Application.
                        </p>
                        <p>
                            In accordance with Section 9 of the "Instructions for Minimum Terms of Developer's End-User
                            License Agreement," both Apple and Google and their subsidiaries shall be third-party
                            beneficiaries of this End User License Agreement and — upon Your acceptance of the terms and
                            conditions of this License Agreement, both Apple and Google will have the right (and will be
                            deemed to have accepted the right) to enforce this End User License Agreement against You as
                            a third-party beneficiary thereof.
                        </p>

                        {/* 15 */}
                        <h2 className="eula-doc-h2" id="ipr">15. INTELLECTUAL PROPERTY RIGHTS</h2>
                        <p>
                            RigneyCo and the End-User acknowledge that, in the event of any third-party claim that the
                            Licensed Application or the End-User's possession and use of that Licensed Application
                            infringes on the third party's intellectual property rights, RigneyCo, and not the Services,
                            will be solely responsible for the investigation, defense, settlement, and discharge of any
                            such intellectual property infringement claims.
                        </p>

                        {/* 16 */}
                        <h2 className="eula-doc-h2" id="law">16. APPLICABLE LAW</h2>
                        <p>
                            This License Agreement is governed by the laws of the State of Washington excluding its
                            conflicts of law rules.
                        </p>

                        {/* 17 */}
                        <h2 className="eula-doc-h2" id="misc">17. MISCELLANEOUS</h2>
                        <p>
                            17.1 &nbsp; If any of the terms of this agreement should be or become invalid, the validity
                            of the remaining provisions shall not be affected. Invalid terms will be replaced by valid
                            ones formulated in a way that will achieve the primary purpose.
                        </p>
                        <p>
                            17.2 &nbsp; Collateral agreements, changes and amendments are only valid if laid down in
                            writing. The preceding clause can only be waived in writing.
                        </p>
                    </div>
                </div>

                {/* ── Sticky footer ── */}
                <div className="eula-footer">
                    <button className="eula-btn-decline" onClick={handleDecline}>Decline</button>
                    <button className="eula-btn-accept" onClick={handleAccept}>I Accept</button>
                </div>
            </div>
        </div>
    )
}

const InputModal = ({ 
    show, 
    title, 
    message, 
    placeholder = '',
    warningLevel = 2,
    onClose,
    action,
    initialValue = ''
}) => {
    const [inputValue, setInputValue] = useState(initialValue);

    // Reset input when modal opens/closes
    useEffect(() => {
        if (show) {
            setInputValue(initialValue);
        }
    }, [show, initialValue]);

    const handleSubmit = () => {
        if (action && inputValue.trim()) {
            action(inputValue);
            setInputValue('');
        }
    };

    // Define styles based on warning level
    const getModalStyles = (level) => {
        switch (level) {
            case 0: // Error
                return {
                    iconClass: 'error',
                    icon: '❌',
                    buttonText: 'Submit',
                    buttonClass: 'error'
                };
            case 1: // Warning
                return {
                    iconClass: 'warning',
                    icon: '⚠️',
                    buttonText: 'Submit',
                    buttonClass: 'warning'
                };
            case 2: // Success
                return {
                    iconClass: 'success',
                    icon: '✓',
                    buttonText: 'Submit',
                    buttonClass: 'success'
                };
            default:
                return {
                    iconClass: 'success',
                    icon: '✓',
                    buttonText: 'Submit',
                    buttonClass: 'success'
                };
        }
    };

    const modalStyles = getModalStyles(warningLevel);

    return (
        <div 
            className={`modal-overlay ${show ? 'show' : ''}`}
            onClick={onClose}
        >
            <div 
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`modal-icon ${modalStyles.iconClass}`}>
                    {modalStyles.icon}
                </div>
                <h3 className="modal-title">{title}</h3>
                {message && <p className="modal-message">{message}</p>}
                
                <input
                    type="text"
                    className="input-modal-field"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                />

                <div className="input-modal-buttons">
                    <button 
                        className="modal-button input-modal-btn-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className={`modal-button ${modalStyles.buttonClass}`}
                        onClick={handleSubmit}
                        disabled={!inputValue.trim()}
                    >
                        {modalStyles.buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export {
    Modal,
    FactModal,
    ComponentModal,
    LoginModal,
    InputModal,
    TutorialModal,
    EULAModal
} ;