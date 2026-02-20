package com.daallcnt.suppoter_hub.form.service.impl;

import com.daallcnt.suppoter_hub.form.entity.*;
import com.daallcnt.suppoter_hub.form.payload.MinjooRegisterRequest;
import com.daallcnt.suppoter_hub.form.payload.MinjooRegisterResponse;
import com.daallcnt.suppoter_hub.form.payload.MatchedSupporterView;
import com.daallcnt.suppoter_hub.form.repository.*;
import com.daallcnt.suppoter_hub.form.service.MinjooService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class MinjooServiceImpl implements MinjooService {

    private static final Logger log = LoggerFactory.getLogger(MinjooServiceImpl.class);
    private static final String VALID_ID_NUMBER = "ky2026";
    private static final int PHONE_QUERY_BATCH_SIZE = 800;

    private final MinjooRepository minjooRepository;
    private final ContactRepository contactRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final MatchedPartyMemberRepository matchedPartyMemberRepository;
    private final SuppoterRepository suppoterRepository;

    @Override
    public MinjooRegisterResponse register(MinjooRegisterRequest request) {
        if (request == null) {
            return MinjooRegisterResponse.fail("요청이 올바르지 않습니다.");
        }

        String idNumber = request.idNumber();
        if (idNumber == null || !idNumber.trim().equalsIgnoreCase(VALID_ID_NUMBER)) {
            return MinjooRegisterResponse.fail("식별번호가 올바르지 않습니다.");
        }
        if (!Boolean.TRUE.equals(request.contactConsent())) {
            return MinjooRegisterResponse.fail("연락처 활용 동의가 필요합니다.");
        }

        String phone = normalizePhone(request.phone());
        if (phone.isEmpty()) {
            return MinjooRegisterResponse.fail("전화번호를 입력해 주세요.");
        }
        if (minjooRepository.existsByPhone(phone)) {
            return MinjooRegisterResponse.fail("이미 당원을 찾은 전화번호입니다.");
        }

        ensurePartyMemberSynced();

        Minjoo minjoo = Minjoo.builder()
                .name(request.name() != null ? request.name().trim() : "")
                .phone(phone)
                .idNumber(idNumber.trim())
                .recommend(request.recommend() != null ? request.recommend().trim() : "")
                .contactConsent(true)
                .contactConsentAt(LocalDateTime.now())
                .build();
        minjoo = minjooRepository.save(minjoo);

        List<MinjooRegisterRequest.ContactItem> contactItems = request.contacts();
        if (contactItems != null && !contactItems.isEmpty()) {
            List<PreparedContact> preparedContacts = new ArrayList<>(contactItems.size());
            LinkedHashSet<String> uniquePhones = new LinkedHashSet<>();
            for (MinjooRegisterRequest.ContactItem item : contactItems) {
                String cPhone = normalizePhone(item.phone());
                if (cPhone.isEmpty()) continue;

                String cName = item.name() != null ? item.name().trim() : "";
                preparedContacts.add(new PreparedContact(cName, cPhone, toPhoneKey(cPhone)));
                uniquePhones.add(cPhone);
            }

            if (preparedContacts.isEmpty()) {
                return MinjooRegisterResponse.success(List.of());
            }

            // PartyMember와 비교
            Map<String, PartyMember> partyMemberByPhone = buildPartyMemberPhoneMapByPhones(uniquePhones);
            Set<String> requestPhoneKeys = new HashSet<>();
            for (PreparedContact preparedContact : preparedContacts) {
                requestPhoneKeys.add(preparedContact.phoneKey());
            }
            if (!partyMemberByPhone.keySet().containsAll(requestPhoneKeys)) {
                Map<String, PartyMember> allPartyMemberByPhone = buildPartyMemberPhoneMapAll();
                for (String key : requestPhoneKeys) {
                    if (!partyMemberByPhone.containsKey(key) && allPartyMemberByPhone.containsKey(key)) {
                        partyMemberByPhone.put(key, allPartyMemberByPhone.get(key));
                    }
                }
            }
            MatchResult matchResult = buildMatchResult(preparedContacts, partyMemberByPhone);

            List<Contact> contactsToSave = new ArrayList<>(preparedContacts.size());
            for (PreparedContact item : preparedContacts) {
                contactsToSave.add(Contact.builder()
                        .name(item.name())
                        .phone(item.phone())
                        .minjoo(minjoo)
                        .build());
            }
            List<Contact> savedContacts = contactRepository.saveAll(contactsToSave);

            Set<String> matchedPhonesFromRequest = matchResult.matchedPhonesFromRequest();
            Set<String> alreadyMatchedPhones = findExistingMatchedPhonesByBatches(matchedPhonesFromRequest);
            List<MatchedPartyMember> matchedToSave = new ArrayList<>();
            for (Contact savedContact : savedContacts) {
                String contactPhone = savedContact.getPhone();
                if (!matchedPhonesFromRequest.contains(contactPhone)) continue;
                PartyMember pm = partyMemberByPhone.get(toPhoneKey(contactPhone));
                if (pm == null) continue;

                // DB: matched_party_member에는 중복 없이 저장
                if (alreadyMatchedPhones.add(contactPhone)) {
                    matchedToSave.add(MatchedPartyMember.builder()
                            .contact(savedContact)
                            .partyMember(pm)
                            .build());
                }
            }

            if (!matchedToSave.isEmpty()) {
                matchedPartyMemberRepository.saveAll(matchedToSave);
            }

            log.info(
                    "minjoo/register contacts={}, uniquePhones={}, matchedResponse={}, newlySavedMatched={}",
                    preparedContacts.size(),
                    uniquePhones.size(),
                    matchResult.matchedList().size(),
                    matchedToSave.size()
            );

            return MinjooRegisterResponse.success(matchResult.matchedList());
        }

        return MinjooRegisterResponse.success(List.of());
    }

    private void ensurePartyMemberSynced() {
        if (partyMemberRepository.count() > 0) return;

        List<MatchedSupporterView> supporters = suppoterRepository.findAllWithPhoneProjection();
        List<PartyMember> toSave = new ArrayList<>();
        for (MatchedSupporterView s : supporters) {
            String phone = normalizePhone(s.phone());
            if (phone.isEmpty()) continue;
            toSave.add(PartyMember.builder()
                    .name(s.name() != null ? s.name() : "")
                    .phone(phone)
                    .active(true)
                    .build());
        }
        if (!toSave.isEmpty()) {
            partyMemberRepository.saveAll(toSave);
        }
    }

    private Map<String, PartyMember> buildPartyMemberPhoneMapByPhones(Set<String> phones) {
        Map<String, PartyMember> map = new HashMap<>();
        if (phones == null || phones.isEmpty()) return map;

        List<String> phoneList = new ArrayList<>(phones);
        for (int i = 0; i < phoneList.size(); i += PHONE_QUERY_BATCH_SIZE) {
            int end = Math.min(i + PHONE_QUERY_BATCH_SIZE, phoneList.size());
            List<String> batch = phoneList.subList(i, end);
            for (PartyMember pm : partyMemberRepository.findByPhoneIn(batch)) {
                String key = toPhoneKey(pm.getPhone());
                if (!key.isEmpty()) map.putIfAbsent(key, pm);
            }
        }
        return map;
    }

    private Map<String, PartyMember> buildPartyMemberPhoneMapAll() {
        Map<String, PartyMember> map = new HashMap<>();
        for (PartyMember pm : partyMemberRepository.findAllWithPhone()) {
            String key = toPhoneKey(pm.getPhone());
            if (!key.isEmpty()) {
                map.putIfAbsent(key, pm);
            }
        }
        return map;
    }

    private MatchResult buildMatchResult(
            List<PreparedContact> preparedContacts,
            Map<String, PartyMember> partyMemberByPhone
    ) {
        Set<String> matchedPhonesFromRequest = new LinkedHashSet<>();
        List<MinjooRegisterResponse.MatchedContactView> matchedList = new ArrayList<>();

        for (PreparedContact preparedContact : preparedContacts) {
            PartyMember pm = partyMemberByPhone.get(preparedContact.phoneKey());
            if (pm == null) continue;

            String pmName = pm.getName() != null ? pm.getName().trim() : "";
            String contactName = preparedContact.name() != null ? preparedContact.name().trim() : "";
            String responseName = !contactName.isEmpty() ? contactName : pmName;
            String responsePhone = normalizePhone(pm.getPhone());
            if (responsePhone.isEmpty()) {
                responsePhone = preparedContact.phone();
            }

            matchedList.add(new MinjooRegisterResponse.MatchedContactView(responseName, responsePhone));
            matchedPhonesFromRequest.add(preparedContact.phone());
        }

        return new MatchResult(matchedList, matchedPhonesFromRequest);
    }

    private Set<String> findExistingMatchedPhonesByBatches(Set<String> phones) {
        Set<String> existing = new HashSet<>();
        if (phones == null || phones.isEmpty()) {
            return existing;
        }

        List<String> phoneList = new ArrayList<>(phones);
        for (int i = 0; i < phoneList.size(); i += PHONE_QUERY_BATCH_SIZE) {
            int end = Math.min(i + PHONE_QUERY_BATCH_SIZE, phoneList.size());
            List<String> batch = phoneList.subList(i, end);
            existing.addAll(matchedPartyMemberRepository.findExistingMatchedPhones(batch));
        }
        return existing;
    }

    private static String toPhoneKey(String value) {
        String normalized = normalizePhone(value);
        if (normalized.isEmpty()) return "";
        return normalized.length() <= 9
                ? normalized
                : normalized.substring(normalized.length() - 9);
    }

    private record PreparedContact(String name, String phone, String phoneKey) {}
    private record MatchResult(
            List<MinjooRegisterResponse.MatchedContactView> matchedList,
            Set<String> matchedPhonesFromRequest
    ) {}

    private static String normalizePhone(String value) {
        if (value == null || value.isBlank()) return "";
        String digits = value.replaceAll("\\D", "");
        if (digits.isEmpty()) return "";
        if (digits.startsWith("82") && digits.length() > 2) {
            digits = "0" + digits.substring(2);
        } else if (!digits.startsWith("0") && digits.length() >= 9) {
            digits = "0" + digits;
        }
        return digits;
    }
}
